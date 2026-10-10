import 'dotenv/config';import express from 'express';import jwt from 'jsonwebtoken';import bcrypt from 'bcryptjs';import crypto from 'crypto';import pg from 'pg';import Razorpay from 'razorpay';import nodemailer from 'nodemailer';
pg.types.setTypeParser(1114,v=>v); // keep TIMESTAMP (no tz) as plain string, e.g. "2026-10-10 10:00:00"
const E=process.env,pool=new pg.Pool({connectionString:E.DATABASE_URL});
const q=async(s,p)=>(await pool.query(s,p)).rows,one=async(s,p)=>(await q(s,p))[0];
const rzp=new Razorpay({key_id:E.RAZORPAY_KEY_ID,key_secret:E.RAZORPAY_KEY_SECRET});
const app=express();
const hmac=(k,d)=>crypto.createHmac('sha256',k).update(d).digest('hex');
const same=(a,b)=>{a=Buffer.from(a||'');b=Buffer.from(b);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const wrap=f=>(q,s)=>f(q,s).catch(e=>{console.error(e.message);s.status(500).json({error:'Server error'})});
// Idempotent: row lock + UNIQUE(student,course) => one payment, one enrolment, however many callbacks arrive
async function settle(orderId,payId){const c=await pool.connect();try{await c.query('BEGIN');
 const p=(await c.query('SELECT * FROM payments WHERE gateway_order_id=$1 FOR UPDATE',[orderId])).rows[0];
 if(p&&p.status!=='paid'&&p.status!=='refunded'){await c.query("UPDATE payments SET status='paid',gateway_payment_id=$1 WHERE id=$2",[payId,p.id]);
  await c.query("INSERT INTO enrollments(student_id,course_id,payment_id) VALUES($1,$2,$3) ON CONFLICT(student_id,course_id) DO UPDATE SET status='active',payment_id=EXCLUDED.payment_id",[p.student_id,p.course_id,p.id])}
 await c.query('COMMIT');return p}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
// Webhook first: needs the raw body for signature check
app.post('/api/webhooks/razorpay',express.raw({type:'application/json'}),wrap(async(r,s)=>{
 if(!same(r.headers['x-razorpay-signature'],hmac(E.RAZORPAY_WEBHOOK_SECRET,r.body)))return s.sendStatus(400);
 const ev=JSON.parse(r.body),p=ev.payload?.payment?.entity;
 if(ev.event==='payment.captured'||ev.event==='order.paid')await settle(p.order_id,p.id);
 if(ev.event==='payment.failed')await q("UPDATE payments SET status='failed' WHERE gateway_order_id=$1 AND status='pending'",[p.order_id]);
 if(ev.event==='refund.processed')await q("WITH p AS(UPDATE payments SET status='refunded' WHERE gateway_payment_id=$1 RETURNING id) UPDATE enrollments SET status='revoked' WHERE payment_id IN(SELECT id FROM p)",[ev.payload.refund.entity.payment_id]);
 s.sendStatus(200)}));
app.use(express.json());
const auth=(r,s,n)=>{try{r.user=jwt.verify((r.headers.authorization||'').slice(7),E.JWT_SECRET);n()}catch{s.status(401).json({error:'Login required'})}};
const staff=(r,s,n)=>r.user.role==='admin'?n():s.status(403).json({error:'Admin access only'});
const mailer=E.GMAIL_USER&&E.GMAIL_APP_PASSWORD?nodemailer.createTransport({service:'gmail',auth:{user:E.GMAIL_USER,pass:E.GMAIL_APP_PASSWORD}}):null;
app.post('/api/auth/signup/request-otp',wrap(async(r,s)=>{const name=String(r.body.name||'').trim(),email=String(r.body.email||'').trim().toLowerCase();if(name.length<2||!/^\S+@\S+\.\S+$/.test(email))return s.status(400).json({error:'Enter a valid name and email'});if(!mailer)return s.status(503).json({error:'Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in server .env'});if(await one('SELECT id FROM users WHERE lower(email)=lower($1)',[email]))return s.status(409).json({error:'An account with this email already exists'});const code=String(crypto.randomInt(100000,1000000));await q("CREATE TABLE IF NOT EXISTS signup_otps(email VARCHAR(160) PRIMARY KEY,name VARCHAR(120) NOT NULL,otp_hash VARCHAR(64) NOT NULL,expires_at TIMESTAMPTZ NOT NULL,attempts INT NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");await q("INSERT INTO signup_otps(email,name,otp_hash,expires_at,attempts) VALUES($1,$2,$3,now()+interval '10 minutes',0) ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,otp_hash=EXCLUDED.otp_hash,expires_at=EXCLUDED.expires_at,attempts=0,created_at=now()",[email,name,hmac(E.JWT_SECRET,code)]);try{await mailer.sendMail({from:E.GMAIL_USER,to:email,subject:'Your Innovel verification code',text:`Your Innovel verification code is ${code}. It expires in 10 minutes.`});}catch(e){await q('DELETE FROM signup_otps WHERE email=$1',[email]);throw new Error('Unable to send verification email. Check Gmail App Password and account settings.')}s.json({ok:true,message:'Verification code sent to your email.'})}));
app.post('/api/auth/signup/verify',wrap(async(r,s)=>{const email=String(r.body.email||'').trim().toLowerCase(),otp=String(r.body.otp||'').trim(),password=String(r.body.password||'');if(!/^\d{6}$/.test(otp)||password.length<8)return s.status(400).json({error:'Enter the 6-digit code and a password with at least 8 characters'});const row=await one('SELECT * FROM signup_otps WHERE email=$1',[email]);if(!row||new Date(row.expires_at)<new Date())return s.status(400).json({error:'Code expired. Request a new code.'});if(row.attempts>=5)return s.status(429).json({error:'Too many attempts. Request a new code.'});if(!same(row.otp_hash,hmac(E.JWT_SECRET,otp))){await q('UPDATE signup_otps SET attempts=attempts+1 WHERE email=$1',[email]);return s.status(400).json({error:'Incorrect verification code'});}const hash=await bcrypt.hash(password,12);const c=await pool.connect();try{await c.query('BEGIN');const existing=(await c.query('SELECT id FROM users WHERE lower(email)=lower($1) FOR UPDATE',[email])).rows[0];if(existing)throw new Error('An account with this email already exists');await c.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'student')",[row.name,email,hash]);await c.query('DELETE FROM signup_otps WHERE email=$1',[email]);await c.query('COMMIT')}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}s.status(201).json({ok:true,message:'Email verified. Account created. You can now sign in.'})}));
app.post('/api/auth/login',wrap(async(r,s)=>{const u=await one('SELECT * FROM users WHERE email=$1',[r.body.email]);
 if(!u||!await bcrypt.compare(r.body.password||'',u.password_hash))return s.status(401).json({error:'Wrong email or password'});
 s.json({token:jwt.sign({id:u.id,role:u.role},E.JWT_SECRET,{expiresIn:'8h'}),name:u.name,role:u.role})}));
app.get('/api/courses',wrap(async(r,s)=>s.json((await q('SELECT id,title,description,price::float,currency FROM courses WHERE active ORDER BY id')))));
app.post('/api/admin/courses',auth,staff,wrap(async(r,s)=>{const title=String(r.body.title||'').trim(),description=String(r.body.description||'').trim(),price=Number(r.body.price),currency=String(r.body.currency||'INR').toUpperCase();if(!title||!Number.isFinite(price)||price<0||! /^[A-Z]{3}$/.test(currency))return s.status(400).json({error:'Valid title, non-negative price and 3-letter currency are required'});const c=await one('INSERT INTO courses(title,description,price,currency,active) VALUES($1,$2,$3,$4,true) RETURNING id,title,description,price::float,currency',[title,description,price,currency]);s.status(201).json(c)}));
app.put('/api/admin/courses/:id',auth,staff,wrap(async(r,s)=>{const title=String(r.body.title||'').trim(),description=String(r.body.description||'').trim(),price=Number(r.body.price),currency=String(r.body.currency||'INR').toUpperCase();if(!title||!Number.isFinite(price)||price<0||! /^[A-Z]{3}$/.test(currency))return s.status(400).json({error:'Valid title, non-negative price and 3-letter currency are required'});const c=await one('UPDATE courses SET title=$1,description=$2,price=$3,currency=$4 WHERE id=$5 RETURNING id,title,description,price::float,currency',[title,description,price,currency,r.params.id]);if(!c)return s.status(404).json({error:'Course not found'});s.json(c)}));
app.get('/api/admin/zoom-meetings',auth,staff,wrap(async(r,s)=>s.json(await q('SELECT z.id,z.topic,z.start_time,z.duration,z.timezone,z.status,c.title AS course FROM zoom_meetings z JOIN courses c ON c.id=z.course_id ORDER BY z.start_time DESC'))));
app.post('/api/payments/create-order',auth,wrap(async(r,s)=>{
 const c=await one('SELECT * FROM courses WHERE id=$1 AND active',[r.body.courseId]);if(!c)return s.status(404).json({error:'Course not found'});
 if(await one("SELECT 1 FROM enrollments WHERE student_id=$1 AND course_id=$2 AND status='active'",[r.user.id,c.id]))return s.status(409).json({error:'Already enrolled'});
 const o=await rzp.orders.create({amount:Math.round(Number(c.price)*100),currency:c.currency,receipt:`c${c.id}u${r.user.id}t${Date.now()}`}); // price always from DB
 await q('INSERT INTO payments(student_id,course_id,gateway_order_id,amount,currency) VALUES($1,$2,$3,$4,$5)',[r.user.id,c.id,o.id,c.price,c.currency]);
 s.json({orderId:o.id,amount:o.amount,currency:o.currency,keyId:E.RAZORPAY_KEY_ID,title:c.title})}));
app.post('/api/payments/verify',auth,wrap(async(r,s)=>{const{razorpay_order_id:o,razorpay_payment_id:p,razorpay_signature:g}=r.body;
 if(!await one('SELECT 1 FROM payments WHERE gateway_order_id=$1 AND student_id=$2',[o,r.user.id]))return s.status(404).json({error:'Not found'});
 if(!same(g,hmac(E.RAZORPAY_KEY_SECRET,`${o}|${p}`)))return s.status(400).json({error:'Signature mismatch'});
 await settle(o,p);s.json({status:'paid',reference:o})}));
app.get('/api/me/payments',auth,wrap(async(r,s)=>s.json(await q('SELECT p.gateway_order_id AS ref,p.amount::float,p.currency,p.status,p.created_at,c.title FROM payments p JOIN courses c ON c.id=p.course_id WHERE p.student_id=$1 ORDER BY p.id DESC',[r.user.id]))));
app.get('/api/me/courses',auth,wrap(async(r,s)=>s.json(await q("SELECT c.id,c.title,c.description,e.status,e.enrolled_at FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.student_id=$1",[r.user.id]))));
// Zoom Server-to-Server OAuth; tokens + start_url never leave the server
let tk={v:'',exp:0};
async function zoom(path,opt={}){if(Date.now()>tk.exp){const r=await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${E.ZOOM_ACCOUNT_ID}`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(`${E.ZOOM_CLIENT_ID}:${E.ZOOM_CLIENT_SECRET}`).toString('base64')}});
 const j=await r.json();if(!r.ok)throw new Error('Zoom auth failed');tk={v:j.access_token,exp:Date.now()+(j.expires_in-60)*1000}}
 const r=await fetch('https://api.zoom.us/v2'+path,{...opt,headers:{Authorization:'Bearer '+tk.v,'Content-Type':'application/json'}});
 if(!r.ok)throw new Error('Zoom '+r.status);return r.status===204?null:r.json()}
app.post('/api/admin/zoom-meetings',auth,staff,wrap(async(r,s)=>{const{courseId,batchId=null,topic,startTime,duration,timezone}=r.body;
 const d=new Date(startTime);if(!courseId||!topic?.trim()||!timezone||isNaN(d)||!(duration>=15&&duration<=480))return s.status(400).json({error:'Topic, course, valid start, timezone and 15–480 min duration are required'});
 const m=await zoom('/users/me/meetings',{method:'POST',body:JSON.stringify({topic,type:2,start_time:startTime,duration,timezone})});
 await q('INSERT INTO zoom_meetings(course_id,batch_id,zoom_meeting_id,topic,start_time,duration,timezone,join_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[courseId,batchId,String(m.id),topic,startTime,duration,timezone,m.join_url]);
 s.status(201).json({ok:true})}));
app.delete('/api/admin/zoom-meetings/:id',auth,staff,wrap(async(r,s)=>{const m=await one('SELECT zoom_meeting_id FROM zoom_meetings WHERE id=$1',[r.params.id]);
 if(!m)return s.sendStatus(404);await zoom('/meetings/'+m.zoom_meeting_id,{method:'DELETE'});await q("UPDATE zoom_meetings SET status='cancelled' WHERE id=$1",[r.params.id]);s.json({ok:true})}));
app.get('/api/me/zoom-meetings',auth,wrap(async(r,s)=>s.json(await q("SELECT z.id,z.topic,z.start_time,z.duration,z.timezone,z.status,c.title AS course,CASE WHEN z.status='cancelled' THEN NULL ELSE z.join_url END AS join_url FROM zoom_meetings z JOIN enrollments e ON e.course_id=z.course_id AND e.student_id=$1 AND e.status='active' JOIN courses c ON c.id=z.course_id ORDER BY z.start_time",[r.user.id]))));
app.listen(E.PORT||4000);
