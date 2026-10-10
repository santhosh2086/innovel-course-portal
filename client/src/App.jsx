import { useEffect, useMemo, useState } from 'react';

const api = async (path, options = {}, token = localStorage.token) => {
  const response = await fetch('/api' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
};

const money = (amount, currency = 'INR') => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency, maximumFractionDigits: 0,
}).format(Number(amount || 0));

const courseMeta = [
  { category: 'Development', level: 'Beginner to advanced', duration: '12 weeks', icon: '</>', tone: 'violet', lessons: '42 lessons' },
  { category: 'Frontend', level: 'Beginner friendly', duration: '8 weeks', icon: '✳', tone: 'blue', lessons: '36 lessons' },
  { category: 'Backend', level: 'Intermediate', duration: '10 weeks', icon: '⌘', tone: 'mint', lessons: '38 lessons' },
  { category: 'Database', level: 'Beginner friendly', duration: '4 weeks', icon: '▤', tone: 'orange', lessons: '18 lessons' },
  { category: 'Programming', level: 'All levels', duration: '6 weeks', icon: '{ }', tone: 'pink', lessons: '24 lessons' },
  { category: 'Career', level: 'Job-ready', duration: '3 weeks', icon: '↗', tone: 'navy', lessons: '16 lessons' },
];

function Icon({ name }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 16a3 3 0 0 1 3-3h13M8 7h7"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h2M14 14h2"/></>,
    wallet: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M16 15h2"/><path d="M6 5V3h12"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    play: <><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.book}</svg>;
}

function Brand() { return <div className="brand-mark"><span className="brand-symbol">i</span><span>innovel<small>LEARN. BUILD. GROW.</small></span></div>; }

function getOriginalLogoUrl(icon = '') {
 const aliases = { nodejs: 'nodedotjs', html5: 'html5', css3: 'css3', vscode: 'visualstudiocode', amazonwebservices: 'amazonaws', postgresql: 'postgresql', mongodb: 'mongodb', express: 'express', javascript: 'javascript', typescript: 'typescript', github: 'github', mysql: 'mysql', redis: 'redis', docker: 'docker', kubernetes: 'kubernetes', jupyter: 'jupyter', playwright: 'playwright' };
 return `https://cdn.simpleicons.org/${aliases[icon] || icon}`;
}

function getCourseTools(title = '') {
 const t=title.toLowerCase();
 const sets=[
  {match:/mern|full.?stack/,tools:[['MongoDB','mongodb','M','#13aa52'],['Express','express','Ex','#555'],['React','react','⚛','#61dafb'],['Node.js','nodejs','N','#539e43'],['JavaScript','javascript','JS','#f0db4f'],['Git','git','Git','#f05032']]},
  {match:/react|frontend|front.end|ui/,tools:[['React','react','⚛','#61dafb'],['JavaScript','javascript','JS','#f0db4f'],['HTML5','html5','5','#e34f26'],['CSS3','css3','3','#1572b6'],['Vite','vite','V','#646cff'],['Git','git','Git','#f05032']]},
  {match:/node|backend|api|express/,tools:[['Node.js','nodejs','N','#539e43'],['Express','express','Ex','#555'],['PostgreSQL','postgresql','PG','#4169e1'],['Postman','postman','P','#ff6c37'],['JavaScript','javascript','JS','#f0db4f'],['Git','git','Git','#f05032']]},
  {match:/mongo|database|sql|data/,tools:[['MongoDB','mongodb','M','#13aa52'],['PostgreSQL','postgresql','PG','#4169e1'],['MySQL','mysql','SQL','#4479a1'],['Redis','redis','R','#dc382d'],['Docker','docker','D','#2496ed']]},
  {match:/javascript|programming/,tools:[['JavaScript','javascript','JS','#f0db4f'],['HTML5','html5','5','#e34f26'],['CSS3','css3','3','#1572b6'],['Git','git','Git','#f05032'],['VS Code','vscode','VS','#007acc']]},
  {match:/career|git|interview/,tools:[['Git','git','Git','#f05032'],['GitHub','github','GH','#181717'],['VS Code','vscode','VS','#007acc'],['Markdown','markdown','MD','#333']]},
  {match:/typescript/,tools:[['TypeScript','typescript','TS','#3178c6'],['React','react','⚛','#61dafb'],['Node.js','nodejs','N','#539e43'],['Vite','vite','V','#646cff']]},
  {match:/python/,tools:[['Python','python','Py','#3776ab'],['Jupyter','jupyter','J','#f37626'],['Git','git','Git','#f05032']]},
  {match:/figma|ui.?ux|design/,tools:[['Figma','figma','F','#f24e1e'],['HTML5','html5','5','#e34f26'],['CSS3','css3','3','#1572b6']]},
  {match:/devops|docker|ci.?cd/,tools:[['Docker','docker','D','#2496ed'],['Kubernetes','kubernetes','K8s','#326ce5'],['GitHub','github','GH','#181717']]},
  {match:/cloud|aws/,tools:[['Amazon Web Services','amazonwebservices','AWS','#ff9900'],['Docker','docker','D','#2496ed'],['Linux','linux','L','#333']]},
  {match:/data structures|algorithms/,tools:[['JavaScript','javascript','JS','#f0db4f'],['Python','python','Py','#3776ab'],['Git','git','Git','#f05032']]},
  {match:/testing|test/,tools:[['Jest','jest','J','#c21325'],['React','react','⚛','#61dafb'],['Playwright','playwright','Pw','#2ead33']]},
  {match:/full.?stack projects/,tools:[['React','react','⚛','#61dafb'],['Node.js','nodejs','N','#539e43'],['MongoDB','mongodb','M','#13aa52'],['Docker','docker','D','#2496ed']]}
 ]; const found=sets.find(x=>x.match.test(t)) || sets[0];
 return found.tools.map(([name,icon,short,color])=>({name,icon,short,color}));
}

function CourseCard({ course, index, enrolled, onBuy, busy, onOpen }) {
  const meta = courseMeta[index % courseMeta.length];
  return <article className="course-card" style={{ '--card-delay': `${index * 65}ms` }}>
    <div className={`course-art ${meta.tone}`}><span className="art-orbit orbit-one"/><span className="art-orbit orbit-two"/><span className="art-icon course-brand-logo">{getCourseTools(course.title)[0] && <><img src={getOriginalLogoUrl(getCourseTools(course.title)[0].icon)} onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='block'; }} alt={`${course.title} logo`}/><b style={{display:'none'}}>{getCourseTools(course.title)[0].short}</b></>}</span><span className="art-index">COURSE {String(index + 1).padStart(2, '0')}</span></div>
    <div className="course-body">
      <div className="course-meta"><span>{meta.category}</span><span className="meta-dot"/>{meta.level}</div>
      <h3>{course.title}</h3><p>{course.description || 'Build practical skills with guided lessons and real-world projects.'}</p>
      <div className="course-facts"><span><Icon name="clock"/>{meta.duration}</span><span><Icon name="book"/>{meta.lessons}</span></div>
      <div className="course-bottom"><div><small>Course fee</small><strong>{money(course.price, course.currency)}</strong></div>
        <button className="btn btn-dark btn-small" onClick={() => onOpen(course)}>{enrolled ? 'Continue course' : 'Explore course'} <Icon name="arrow"/></button>
      </div>
    </div>
  </article>;
}

function EmptyState({ icon = 'book', title, text, action, onAction }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon}/></span><h3>{title}</h3><p>{text}</p>{action && <button className="btn btn-dark" onClick={onAction}>{action}<Icon name="arrow"/></button>}</div>;
}

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.user || 'null'); } catch { return null; } });
  const [view, setView] = useState('home');
  const [courses, setCourses] = useState([]);
  const [mine, setMine] = useState([]);
  const [payments, setPayments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All courses');
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [adminLoginMode, setAdminLoginMode] = useState(false);
  const [adminCourseEdit, setAdminCourseEdit] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [adminClasses, setAdminClasses] = useState([]);
  const [adminTab, setAdminTab] = useState('view');
  const [openingCourse, setOpeningCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const openCourse = (course) => { setOpeningCourse(course); setCourseDetails(null); window.setTimeout(() => { setCourseDetails(course); setOpeningCourse(null); }, 1000); };
  const openingTools = openingCourse ? getCourseTools(openingCourse.title) : [];
  const isStaff = Boolean(user && String(user.role || '').toLowerCase() === 'admin');
  useEffect(() => {
    if (!user && ['mine', 'live', 'pay', 'admin', 'admin-courses', 'admin-live'].includes(view)) setView(view.startsWith('admin') ? 'admin-login' : 'login');
    else if (user && view.startsWith('admin') && !isStaff) setView('home');
    else if (user && isStaff && !['admin-courses', 'admin-live', 'admin-login'].includes(view)) setView('admin-courses');
  }, [user, view, isStaff]);

  const load = async () => {
    setLoading(true);
    const tasks = [api('/courses').then(setCourses).catch(e => setError(e.message))];
    if (localStorage.token) {
      if (String(user?.role || '').toLowerCase() === 'admin') tasks.push(api('/admin/zoom-meetings').then(setAdminClasses).catch(() => setAdminClasses([])));
      tasks.push(api('/me/courses').then(setMine).catch(() => setMine([])));
      tasks.push(api('/me/payments').then(setPayments).catch(() => setPayments([])));
      tasks.push(api('/me/zoom-meetings').then(setClasses).catch(() => setClasses([])));
    } else { setMine([]); setPayments([]); setClasses([]); }
    await Promise.all(tasks);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);
  useEffect(() => { if (!message) return; const id = setTimeout(() => setMessage(''), 5000); return () => clearTimeout(id); }, [message]);

  const enrolledIds = useMemo(() => new Set(mine.filter(c => c.status === 'active').map(c => Number(c.id))), [mine]);
  const categories = ['All courses', ...new Set(courses.map((_, i) => courseMeta[i % courseMeta.length].category))];
  const filteredCourses = courses.filter((course, i) => {
    const category = courseMeta[i % courseMeta.length].category;
    return (filter === 'All courses' || filter === category) && `${course.title} ${course.description || ''} ${category}`.toLowerCase().includes(search.toLowerCase());
  });
  const upcomingClasses = classes.filter(m => m.status !== 'cancelled' && new Date(String(m.start_time).replace(' ', 'T')) >= new Date(Date.now() - (m.duration || 0) * 60000));

  const login = async (event) => {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await api('/auth/login', { method: 'POST', body: { email: form.get('email'), password: form.get('password') } }, '');
      if (adminLoginMode && String(result.role || '').toLowerCase() !== 'admin') throw new Error('This login is for administrators only.'); if (!adminLoginMode && String(result.role || '').toLowerCase() === 'admin') throw new Error('Please use the separate Admin login.'); localStorage.token = result.token; localStorage.user = JSON.stringify(result); setUser(result); setView(String(result.role || '').toLowerCase() === 'admin' ? 'admin-courses' : 'home'); setMessage(`Welcome back, ${result.name || 'learner'}!`);
    } catch (e) { setError(e.message); }
  };


  const requestOtp = async (event) => { event.preventDefault(); setError(''); const data = Object.fromEntries(new FormData(event.currentTarget)); try { const r = await api('/auth/signup/request-otp',{method:'POST',body:{name:data.name,email:data.email}},''); setOtpSent(true); setMessage(r.message); } catch(e) { setError(e.message); } };
  const verifySignup = async (event) => { event.preventDefault(); setError(''); const data = Object.fromEntries(new FormData(event.currentTarget)); try { const r = await api('/auth/signup/verify',{method:'POST',body:{name:data.name,email:data.email,otp:data.otp,password:data.password}},''); setMessage(r.message); setAuthMode('login'); setOtpSent(false); } catch(e) { setError(e.message); } };
  const addCourse = async (event) => { event.preventDefault(); setError(''); const form=event.currentTarget; const data=Object.fromEntries(new FormData(form)); try { await api('/admin/courses',{method:'POST',body:{title:data.title,description:data.description,price:Number(data.price),currency:data.currency||'INR'}}); setMessage('Course added successfully.'); form.reset(); await load(); } catch(e) { setError(e.message); } };

  const buy = async (course) => {
    if (!user) { setView('login'); setMessage('Sign in to enrol in a course.'); return; }
    setBusy(course.id); setError('');
    try {
      const order = await api('/payments/create-order', { method: 'POST', body: { courseId: course.id } });
      if (!window.Razorpay) throw new Error('Razorpay checkout did not load. Check your internet connection and refresh.');
      new window.Razorpay({ key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency, name: 'Innovel', description: order.title,
        handler: async result => { try { const verified = await api('/payments/verify', { method: 'POST', body: result }); setMessage(`Payment verified. Reference: ${verified.reference}`); await load(); setView('mine'); } catch (e) { setError(e.message); } finally { setBusy(null); } },
        modal: { ondismiss: () => setBusy(null) }, theme: { color: '#6758e8' }
      }).open();
    } catch (e) { setError(e.message); setBusy(null); }
  };

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); setView('home'); setAdminLoginMode(false); setMobileNav(false); setMessage('You have signed out.'); };
  const schedule = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement));
    try {
      await api('/admin/zoom-meetings', { method: 'POST', body: { courseId: Number(data.courseId), topic: data.topic, startTime: data.startTime + ':00', duration: Number(data.duration), timezone: data.timezone } });
      setMessage('Live class scheduled successfully.');
      formElement?.reset?.();
      await load();
    } catch (e) { setError(e.message); }
  };

  const navItems = isStaff ? [
    { id: 'admin-courses', label: 'Courses', icon: 'book' },
    { id: 'admin-live', label: 'Live classes', icon: 'calendar' },
  ] : [
    { id: 'home', label: 'Overview', icon: 'home' },
    { id: 'catalog', label: 'Explore courses', icon: 'book' },
    ...(user ? [{ id: 'mine', label: 'My learning', icon: 'play', count: mine.filter(c => c.status === 'active').length }, { id: 'live', label: 'Live classes', icon: 'calendar', count: upcomingClasses.length }, { id: 'pay', label: 'Payments', icon: 'wallet', count: payments.length }] : []),
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <button className="brand-button" onClick={() => { setView(isStaff ? 'admin-courses' : 'home'); setMobileNav(false); }}><Brand/></button>
      <div className="side-label">{isStaff ? "ADMIN WORKSPACE" : "LEARNING SPACE"}</div>
      <nav className="side-nav">{navItems.map(item => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => { setView(item.id); setMobileNav(false); }}><Icon name={item.icon}/><span>{item.label}</span>{item.count > 0 && <b>{item.count}</b>}</button>)}</nav>
      <div className="sidebar-bottom">{!isStaff && <div className="help-card"><span className="help-spark">✳</span><strong>Keep growing.</strong><p>Small steps today. Big things tomorrow.</p><button onClick={() => { setView('catalog'); setMobileNav(false); }}>Find your next skill <Icon name="arrow"/></button></div>}
        {user ? <div className="profile-row"><div className="avatar">{(user.name || 'L').slice(0, 1).toUpperCase()}</div><div className="profile-text"><strong>{user.name || 'Learner'}</strong><small>{user.role || 'student'}</small></div><button className="icon-button" title="Sign out" onClick={logout}><Icon name="logout"/></button></div> : <button className="btn btn-dark sign-in-side" onClick={() => setView('login')}>Sign in <Icon name="arrow"/></button>}
      </div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle menu"><Icon name="menu"/></button><div className="breadcrumb">INNOVEL <span>/</span> {view === 'home' ? (user ? 'OVERVIEW' : 'LEARN') : view.replace('admin-courses','COURSES').replace('admin-live','LIVE CLASSES').replace('admin-login','ADMIN LOGIN').replace('mine', 'MY LEARNING').replace('pay', 'PAYMENTS').replace('live', 'LIVE CLASSES').replace('catalog', 'COURSE CATALOG').replace('admin', 'CLASS SCHEDULER').toUpperCase()}</div><div className="topbar-right"><span className="online-dot"/> Learning portal <span className="topbar-divider"/>{user ? <div className="top-avatar">{(user.name || 'L').slice(0, 1).toUpperCase()}</div> : <button className="top-signin" onClick={() => setView('login')}>Sign in <Icon name="arrow"/></button>}</div></header>
      {message && <div className="notice success-notice" role="status"><Icon name="check"/>{message}<button onClick={() => setMessage('')}>×</button></div>}
      {error && <div className="notice error-notice" role="alert"><span>!</span>{error}<button onClick={() => setError('')}>×</button></div>}

      {view === 'home' && <div className="page-content">
        <section className="welcome-banner"><div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-line"/>{user ? 'YOUR LEARNING SPACE' : 'WELCOME TO INNOVEL'}</div><h1>{user ? <>Good to see you,<br/><em>{(user.name || 'learner').split(' ')[0]}.</em></> : <>Skills for your<br/><em>next chapter.</em></>}</h1><p>{user ? 'Pick up where you left off, join your next class, or find a new skill to build.' : 'Practical tech courses, guided learning, and live sessions designed to move your career forward.'}</p><div className="welcome-actions"><button className="btn btn-primary" onClick={() => setView('catalog')}>Explore courses <Icon name="arrow"/></button>{user ? <button className="btn btn-ghost" onClick={() => setView('live')}>View live classes <Icon name="calendar"/></button> : <button className="btn btn-ghost" onClick={() => setView('login')}>I have an account <Icon name="arrow"/></button>}</div><div className="welcome-proof"><div className="proof-avatars"><i>i</i><i>✳</i><i>+</i></div><span><strong>{courses.length || '—'} courses</strong> ready to explore</span></div></div><div className="welcome-visual"><div className="visual-glow"/><div className="visual-orbit orbit-a"/><div className="visual-orbit orbit-b"/><div className="visual-center"><span>i.</span><small>LEARN<br/>BY DOING</small></div><div className="floating-note note-top"><span className="note-icon purple"><Icon name="play"/></span><span><strong>Learn by building</strong><small>Real-world projects</small></span></div><div className="floating-note note-bottom"><span className="note-icon green"><Icon name="check"/></span><span><strong>Make progress</strong><small>One lesson at a time</small></span></div><div className="visual-caption">A BETTER WAY TO LEARN TECH <span>✳</span></div></div></section>
        <section className="stats-row"><div className="stat-card"><span className="stat-icon purple"><Icon name="book"/></span><div><small>COURSES TO EXPLORE</small><strong>{courses.length}</strong><p>Skills across tech</p></div></div><div className="stat-card"><span className="stat-icon blue"><Icon name="play"/></span><div><small>MY COURSES</small><strong>{mine.filter(c => c.status === 'active').length}</strong><p>Learning in progress</p></div></div><div className="stat-card"><span className="stat-icon green"><Icon name="calendar"/></span><div><small>UPCOMING CLASSES</small><strong>{upcomingClasses.length}</strong><p>Live learning sessions</p></div></div><div className="stat-card"><span className="stat-icon orange"><Icon name="wallet"/></span><div><small>PAYMENTS</small><strong>{payments.length}</strong><p>Transaction records</p></div></div></section>
        {user && <section className="section-block compact-section"><div className="section-heading"><div><div className="eyebrow">YOUR NEXT STEP</div><h2>Continue learning<span>.</span></h2></div><button className="text-link" onClick={() => setView('mine')}>View my learning <Icon name="arrow"/></button></div>{mine.length ? <div className="learning-strip">{mine.filter(c => c.status === 'active').slice(0, 3).map((c, i) => <button className="learning-card" key={c.id} onClick={() => setView('mine')}><span className={`learning-icon tone-${i % 3}`}><Icon name="book"/></span><span className="learning-info"><strong>{c.title}</strong><small>Enrolled · Ready to learn</small><span className="progress-track"><i style={{ width: `${18 + i * 13}%` }}/></span></span><Icon name="arrow"/></button>)}</div> : <div className="inline-empty"><span className="empty-mini"><Icon name="book"/></span><div><strong>Your learning journey starts here</strong><p>Explore the course catalog and enrol in a course that interests you.</p></div><button className="text-link" onClick={() => setView('catalog')}>Browse courses <Icon name="arrow"/></button></div>}</section>}
        <section className="section-block"><div className="section-heading"><div><div className="eyebrow">HANDPICKED FOR YOU</div><h2>Popular courses<span>.</span></h2><p className="section-subtitle">Build practical skills with courses designed around real projects.</p></div><button className="text-link" onClick={() => setView('catalog')}>View all courses <Icon name="arrow"/></button></div>{loading ? <div className="loading-grid"><div/><div/><div/></div> : courses.length ? <div className="course-grid">{courses.slice(0, 3).map((c, i) => <CourseCard key={c.id} course={c} index={i} enrolled={enrolledIds.has(Number(c.id))} onBuy={buy} busy={busy} onOpen={openCourse}/>)}</div> : <EmptyState title="Courses are on their way" text="No active courses were returned by the server. Check the backend and database seed." action="Try again" onAction={load}/>}</section>
        <section className="bottom-cta"><div className="cta-star">✳</div><div><small>YOUR FUTURE IS BUILT ONE SKILL AT A TIME</small><h2>Curiosity looks good on you.</h2><p>Find a course, join a class, and make your next move.</p></div><button className="btn btn-white" onClick={() => setView('catalog')}>Find a course <Icon name="arrow"/></button></section>
      </div>}

      {view === 'catalog' && <div className="page-content inner-page"><div className="page-intro"><div className="eyebrow">THE COURSE LIBRARY</div><h1>Learn something<br/><em>that moves you.</em></h1><p>Practical courses to help you build confidence, create projects, and take the next step in your tech career.</p></div><div className="catalog-tools"><label className="search-box"><Icon name="search"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses or skills…"/><kbd>⌕</kbd></label><div className="filter-tabs">{categories.map(cat => <button key={cat} className={filter === cat ? 'selected' : ''} onClick={() => setFilter(cat)}>{cat}</button>)}</div></div><div className="catalog-result-line"><span><strong>{filteredCourses.length}</strong> courses found</span><span>Learn at your pace <span className="result-star">✳</span></span></div>{filteredCourses.length ? <div className="course-grid">{filteredCourses.map((c, i) => <CourseCard key={c.id} course={c} index={courses.indexOf(c)} enrolled={enrolledIds.has(Number(c.id))} onBuy={buy} busy={busy} onOpen={openCourse}/>)}</div> : <EmptyState icon="search" title="No courses found" text="Try a different search or select another category." action="Clear filters" onAction={() => { setSearch(''); setFilter('All courses'); }}/>}</div>}

      {view === 'login' && <div className="login-layout"><div className="login-art"><div className="login-art-circle circle-one"/><div className="login-art-circle circle-two"/><div className="login-art-copy"><span>INNOVEL / LEARNING PORTAL</span><h1>Make room<br/>for <em>what's next.</em></h1><p>New skills. Fresh ideas. A future you build yourself.</p><div className="login-art-bottom">LEARN. BUILD. GROW. <span>✳</span></div></div></div><div className="login-form-wrap"><div className="login-form-inner"><div className="eyebrow">{authMode==='login'?'WELCOME BACK':'CREATE YOUR ACCOUNT'}</div><h2>{authMode==='login'?<>Good to have<br/>you <em>here.</em></>:<>Start your<br/><em>next chapter.</em></>}</h2><p>{authMode==='login'?'Sign in to access your courses, live classes, and learning progress.':'Verify your email, then create a secure password.'}{' '}</p>{authMode==='login' ? <form className="auth-form" onSubmit={login}><label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="username" required/></label><label>Password<input name="password" type="password" placeholder="Enter your password" autoComplete="current-password" required/></label><button className="btn btn-primary btn-full">Sign in to your account <Icon name="arrow"/></button><button type="button" className="btn btn-outline btn-full" onClick={()=>{setAuthMode('signup');setOtpSent(false);setError('');}}>New student? Sign up</button><button type="button" className="text-link admin-login-link" onClick={()=>{setAdminLoginMode(true);setAuthMode('login');setView('admin-login');setError('');}}>Admin login →</button></form> : (!otpSent ? <form className="auth-form" onSubmit={requestOtp}><label>Full name<input name="name" placeholder="Your name" required minLength="2"/></label><label>Email address<input name="email" type="email" placeholder="you@example.com" required/></label><button className="btn btn-primary btn-full">Send email OTP <Icon name="arrow"/></button><button type="button" className="btn btn-outline btn-full" onClick={()=>setAuthMode('login')}>Back to sign in</button></form> : <form className="auth-form" onSubmit={verifySignup}><label>Full name<input name="name" placeholder="Same name used above" required minLength="2"/></label><label>Email address<input name="email" type="email" placeholder="Same email used above" required/></label><label>6-digit email OTP<input name="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required/></label><label>Create password<input name="password" type="password" minLength="8" placeholder="At least 8 characters" required/></label><button className="btn btn-primary btn-full">Verify email & create account <Icon name="arrow"/></button><button type="button" className="btn btn-outline btn-full" onClick={()=>setOtpSent(false)}>Change email / resend OTP</button></form>)}<div className="login-footnote"><span>✳</span> Your next chapter starts with one small step.</div></div></div></div>}

      {view === 'mine' && <div className="page-content inner-page"><div className="page-intro short-intro"><div className="eyebrow">YOUR PERSONAL LIBRARY</div><h1>My learning<span>.</span></h1><p>Everything you have enrolled in, all in one place.</p></div><div className="content-count"><span className="count-bubble"><Icon name="book"/></span><span><strong>{mine.filter(c => c.status === 'active').length} active courses</strong><small>Keep the momentum going</small></span></div>{mine.length ? <div className="my-course-list">{mine.map((c, i) => <div className="my-course-row" key={c.id}><span className={`my-course-art tone-${i % 4}`}>{courseMeta[i % courseMeta.length].icon}</span><div className="my-course-main"><small>{courseMeta[i % courseMeta.length].category} · {courseMeta[i % courseMeta.length].duration}</small><h3>{c.title}</h3><p>{c.description || 'You are enrolled in this course.'}</p><div className="progress-track"><i style={{ width: `${25 + i * 9}%` }}/></div></div><span className={`status-pill ${c.status}`}>{c.status}</span><button className="btn btn-outline btn-small" onClick={() => setView('live')}>View classes <Icon name="arrow"/></button></div>)}</div> : <EmptyState title="Your library is waiting" text="You have not enrolled in a course yet. Explore the catalog to find your first one." action="Explore courses" onAction={() => setView('catalog')}/>}</div>}

      {view === 'live' && <div className="page-content inner-page"><div className="page-intro short-intro"><div className="eyebrow">LEARN TOGETHER, LIVE</div><h1>Live classes<span>.</span></h1><p>Join scheduled sessions for courses you are enrolled in. Your join link appears when your instructor connects the meeting.</p></div><div className="class-summary"><div className="class-summary-icon"><Icon name="calendar"/></div><div><strong>{upcomingClasses.length} upcoming sessions</strong><small>Times shown in your local timezone</small></div><span className="live-badge"><i/> CLASS SCHEDULE</span></div>{classes.length ? <div className="class-list">{classes.map((m, i) => { const date = new Date(String(m.start_time).replace(' ', 'T')); const ended = date < new Date(Date.now() - (m.duration || 0) * 60000); return <article className="class-card" key={m.id}><div className="class-date"><strong>{Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit' })}</strong><span>{Number.isNaN(date.getTime()) ? 'DATE' : date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span></div><div className="class-detail"><span className="class-course">{m.course || 'INNOVEL CLASS'}</span><h3>{m.topic}</h3><div className="class-meta"><span><Icon name="clock"/>{Number.isNaN(date.getTime()) ? 'Time to be confirmed' : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span><span>{m.duration} minutes</span><span className={`status-pill ${ended ? 'completed' : m.status}`}>{ended ? 'Completed' : m.status}</span></div></div><div className="class-action">{m.join_url && !ended ? <a className="btn btn-primary btn-small" href={m.join_url} target="_blank" rel="noreferrer">Join class <Icon name="arrow"/></a> : <span className="join-pending">{ended ? 'Session ended' : 'Join link pending'}</span>}</div></article>; })}</div> : <EmptyState icon="calendar" title="No classes scheduled yet" text="Once your enrolled course has a session scheduled, it will appear here. Sample classes can be added using the database seed script." action="Browse courses" onAction={() => setView('catalog')}/>}</div>}

      {view === 'pay' && <div className="page-content inner-page"><div className="page-intro short-intro"><div className="eyebrow">YOUR TRANSACTION HISTORY</div><h1>Payments<span>.</span></h1><p>A clear record of your course purchases and payment status.</p></div><div className="payment-summary"><span className="stat-icon orange"><Icon name="wallet"/></span><div><small>RECORDED TRANSACTIONS</small><strong>{payments.length}</strong></div><div className="payment-summary-divider"/><div><small>SUCCESSFUL PAYMENTS</small><strong>{payments.filter(p => p.status === 'paid').length}</strong></div></div>{payments.length ? <div className="payment-table-wrap"><table className="payment-table"><thead><tr><th>COURSE</th><th>REFERENCE</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{payments.map(p => <tr key={p.ref}><td><strong>{p.title}</strong></td><td className="reference-cell">{p.ref}</td><td>{new Date(p.created_at).toLocaleDateString('en-IN')}</td><td><strong>{money(p.amount, p.currency)}</strong></td><td><span className={`status-pill ${p.status}`}>{p.status}</span></td></tr>)}</tbody></table></div> : <EmptyState icon="wallet" title="No payments yet" text="Your course payment records will appear here after you make a purchase." action="Explore courses" onAction={() => setView('catalog')}/>}</div>}

      {view === 'admin-login' && <div className="login-layout"><div className="login-art"><div className="login-art-circle circle-one"/><div className="login-art-circle circle-two"/><div className="login-art-copy"><span>INNOVEL / ADMINISTRATION</span><h1>Manage the<br/><em>learning space.</em></h1><p>Dedicated administrator access for courses and live classes.</p><div className="login-art-bottom">ADMIN ACCESS ONLY <span>✳</span></div></div></div><div className="login-form-wrap"><div className="login-form-inner"><div className="eyebrow">SECURE ADMIN SIGN IN</div><h2>Admin<br/><em>login.</em></h2><p>This sign-in is separate from the student login.</p><form className="auth-form" onSubmit={login}><label>Admin email<input name="email" type="email" placeholder="admin@gmail.com" autoComplete="username" required/></label><label>Password<input name="password" type="password" placeholder="Enter admin password" autoComplete="current-password" required/></label><button className="btn btn-primary btn-full">Sign in as admin <Icon name="arrow"/></button><button type="button" className="btn btn-outline btn-full" onClick={()=>{setAdminLoginMode(false);setView('login');setError('');}}>Back to student login</button></form></div></div></div>}

      {view === 'admin-courses' && <div className="page-content inner-page"><div className="page-intro short-intro"><div className="eyebrow">ADMIN WORKSPACE / COURSES</div><h1>Courses<span>.</span></h1><p>View and modify existing courses, or add a new course to the learning catalog.</p></div><div className="admin-course-layout"><section className="section-block"><div className="section-heading"><div><div className="eyebrow">COURSE LIBRARY</div><h2>Existing courses<span>.</span></h2></div><button className="text-link" onClick={load}>Refresh</button></div>{courses.length ? <div className="admin-course-list">{courses.map((c,i)=><article className="admin-course-row" key={c.id}><div className={`my-course-art tone-${i%4}`}>{getCourseTools(c.title)[0]?.short || 'IT'}</div><div className="my-course-main"><small>COURSE #{c.id}</small><h3>{c.title}</h3><p>{c.description || 'No description added yet.'}</p><strong>{money(c.price,c.currency)}</strong></div><button className="btn btn-outline btn-small" onClick={()=>{setAdminCourseEdit(c);setMessage('');}}>Modify <Icon name="arrow"/></button></article>)}</div>:<EmptyState title="No courses yet" text="Add your first course using the form."/>}</section><form className="schedule-form admin-course-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const d=Object.fromEntries(new FormData(form));try{if(adminCourseEdit){await api('/admin/courses/'+adminCourseEdit.id,{method:'PUT',body:{title:d.title,description:d.description,price:Number(d.price),currency:d.currency||'INR'}});setMessage('Course updated successfully.');}else{await api('/admin/courses',{method:'POST',body:{title:d.title,description:d.description,price:Number(d.price),currency:d.currency||'INR'}});setMessage('Course added successfully.');}setAdminCourseEdit(null);form.reset();await load();}catch(err){setError(err.message);}}}><h3>{adminCourseEdit?'Modify course':'Add new course'}</h3><label>Course title<input name="title" defaultValue={adminCourseEdit?.title||''} placeholder="e.g. MERN Stack Development" required/></label><label>Description<textarea name="description" defaultValue={adminCourseEdit?.description||''} placeholder="What will students learn?" rows="4" required/></label><div className="form-two"><label>Course fee<input name="price" type="number" min="0" step="1" defaultValue={adminCourseEdit?.price||''} required/></label><label>Currency<select name="currency" defaultValue={adminCourseEdit?.currency||'INR'}><option value="INR">INR</option><option value="USD">USD</option></select></label></div><button className="btn btn-primary btn-full">{adminCourseEdit?'Save changes':'Add course'} <Icon name="arrow"/></button>{adminCourseEdit&&<button type="button" className="btn btn-outline btn-full" onClick={()=>setAdminCourseEdit(null)}>Cancel edit</button>}</form></div></div>}

      {view === 'admin-live' && <div className="page-content inner-page"><div className="page-intro short-intro"><div className="eyebrow">ADMIN WORKSPACE / LIVE CLASSES</div><h1>Live classes<span>.</span></h1><p>View scheduled classes and create a new live session.</p></div><section className="section-block"><div className="section-heading"><div><div className="eyebrow">SCHEDULE</div><h2>Existing live classes<span>.</span></h2></div><button className="text-link" onClick={load}>Refresh list</button></div>{adminClasses.length?<div className="class-list">{adminClasses.map(m=><article className="class-card" key={m.id}><div className="class-date"><strong>{new Date(String(m.start_time).replace(' ','T')).toLocaleDateString('en-IN',{day:'2-digit'})}</strong><span>{new Date(String(m.start_time).replace(' ','T')).toLocaleDateString('en-IN',{month:'short'}).toUpperCase()}</span></div><div className="class-detail"><span className="class-course">{m.course}</span><h3>{m.topic}</h3><div className="class-meta"><span>{new Date(String(m.start_time).replace(' ','T')).toLocaleString('en-IN')}</span><span>{m.duration} minutes</span><span className="status-pill">{m.status}</span></div></div></article>)}</div>:<EmptyState icon="calendar" title="No live classes yet" text="New classes will appear here after you schedule them."/>}</section><div className="admin-add-panel"><form className="schedule-form" onSubmit={schedule}><h3>Add a new live class</h3><label>Course<select name="courseId" required>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Class topic<input name="topic" placeholder="e.g. React hooks workshop" required/></label><div className="form-two"><label>Date and time<input name="startTime" type="datetime-local" required/></label><label>Duration (minutes)<input name="duration" type="number" min="15" max="480" defaultValue="60" required/></label></div><label>Timezone<input name="timezone" defaultValue="Asia/Kolkata" required/></label><button className="btn btn-primary btn-full">Create live class <Icon name="arrow"/></button></form></div></div>}
      {(openingCourse || courseDetails) && <div className="course-modal-backdrop" onClick={() => { setOpeningCourse(null); setCourseDetails(null); }} role="presentation"><section className="course-modal" role="dialog" aria-modal="true" aria-label="Course details" onClick={e => e.stopPropagation()}>{openingCourse ? <div className="course-opening"><div className="opening-visual"><div className="tool-orbit orbit-large">{openingTools.slice(0,4).map((tool, i) => <span key={tool.name} className={`orbit-tool orbit-tool-${i}`} title={tool.name}><img src={getOriginalLogoUrl(tool.icon)} onError={e => { e.currentTarget.style.display="none"; e.currentTarget.parentElement.textContent=tool.short; e.currentTarget.parentElement.style.color=tool.color; }} alt={tool.name}/></span>)}</div><div className="opening-core"><img src={getOriginalLogoUrl(openingTools[0]?.icon || "react")} onError={e => { e.currentTarget.style.display="none"; e.currentTarget.nextSibling.style.display="block"; }} alt={openingTools[0]?.name || "Course tool"}/><b>{openingTools[0]?.short || "IT"}</b></div></div><p>Preparing your learning space</p><small>CONNECTING COURSE TOOLS…</small></div> : <><button className="modal-close" onClick={() => setCourseDetails(null)} aria-label="Close">×</button><div className="modal-eyebrow">COURSE PREVIEW · INNOVEL</div><h2>{courseDetails.title}</h2><p className="modal-description">{courseDetails.description || 'Build practical skills with guided lessons and real-world projects.'}</p><div className="modal-facts"><span><Icon name="clock"/>{courseMeta[courses.indexOf(courseDetails) % courseMeta.length]?.duration || '6 weeks'}</span><span><Icon name="book"/>{courseMeta[courses.indexOf(courseDetails) % courseMeta.length]?.lessons || '24 lessons'}</span><strong>{money(courseDetails.price, courseDetails.currency)}</strong></div><h3>Tools you’ll work with</h3><div className="tool-logo-grid">{getCourseTools(courseDetails.title).map(tool => <div className="tool-logo" key={tool.name}><img src={getOriginalLogoUrl(tool.icon)} onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='grid'; }} alt={tool.name}/><span className="tool-fallback" style={{color:tool.color}}>{tool.short}</span><small>{tool.name}</small></div>)}</div><div className="modal-actions"><button className="btn btn-outline" onClick={() => setCourseDetails(null)}>Back to courses</button>{!isStaff && <button className="btn btn-primary" onClick={() => { const c=courseDetails; setCourseDetails(null); buy(c); }}> {enrolledIds.has(Number(courseDetails.id)) ? 'Continue learning' : 'Enrol in course'} <Icon name="arrow"/></button>}</div></>}</section></div>}
      <footer className="app-footer"><Brand/><span>© {new Date().getFullYear()} Innovel IT Training Institute</span><span>Learn. Build. Grow. <b>✳</b></span></footer>
    </main>
  </div>;
}
