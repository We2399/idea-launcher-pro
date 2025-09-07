import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'zh-TW' | 'zh-CN' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation dictionaries
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    leaveRequests: 'Leave Requests',
    calendar: 'Calendar',
    profile: 'Profile',
    employees: 'Team Management',
    reports: 'Reports',
    tasks: 'Tasks',
    cashControl: 'Cash Control',
    settings: 'Settings',
    staffProfile: 'Staff Profile',
    
    // Dashboard
    pendingRequests: 'Pending Requests',
    totalRequests: 'Total Requests',
    remainingDays: 'Remaining Days',
    usedDays: 'Used Days',
    daysRemaining: 'Days Remaining',
    daysUsed: 'Days Used',
    
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    employeeId: 'Employee ID',
    department: 'Department',
    position: 'Position',
    role: 'Role',
    employee: 'Employee',
    manager: 'Senior Management',
    hrAdmin: 'Administrator',
    
    // Leave Types
    sickLeave: 'Sick Leave',
    vacation: 'Vacation',
    maternity: 'Maternity',
    paternity: 'Paternity',
    others: 'Others',
    
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    submit: 'Submit',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    newRequest: 'New Request',
    newReport: 'New Report',
    cashRequest: 'Cash Request',
    cashBalance: 'Cash Balance',
    
    // Tasks
    taskTitle: 'Task Title',
    taskDescription: 'Description',
    assignTo: 'Assign to',
    dueDate: 'Due Date',
    priority: 'Priority',
    status: 'Status',
    
    // Cash Control
    amount: 'Amount',
    currency: 'Currency',
    category: 'Category',
    description: 'Description',
    type: 'Type',
    receiptUrl: 'Receipt URL',
    receipt: 'Receipt',
    cashControlTitle: 'Cash Control',
    totalRequested: 'Total Requested',
    requestApproval: 'Request Approval',
    
    // Profile
    leaveBalances: 'Leave Balances',
    personalDetails: 'Personal Details',
    profileChanges: 'Profile Changes',
    requestChange: 'Request Change',
    
    // Calendar
    leaveCalendar: 'Leave Calendar',
    upcomingLeave: 'Upcoming Leave',
    colorLegend: 'Color Legend'
  },
  'zh-TW': {
    // Navigation
    dashboard: '儀表板',
    leaveRequests: '請假申請',
    calendar: '行事曆',
    profile: '個人資料',
    employees: '團隊管理',
    reports: '報告',
    tasks: '任務',
    cashControl: '現金管理',
    settings: '設定',
    staffProfile: '員工資料',
    
    // Dashboard
    pendingRequests: '待審核申請',
    totalRequests: '總申請數',
    remainingDays: '剩餘天數',
    usedDays: '已使用天數',
    daysRemaining: '剩餘天數',
    daysUsed: '已使用天數',
    
    // Auth
    signIn: '登入',
    signUp: '註冊',
    email: '電子郵件',
    password: '密碼',
    firstName: '名字',
    lastName: '姓氏',
    employeeId: '員工編號',
    department: '部門',
    position: '職位',
    role: '角色',
    employee: '員工',
    manager: '高級管理層',
    hrAdmin: '管理員',
    
    // Leave Types
    sickLeave: '病假',
    vacation: '休假',
    maternity: '產假',
    paternity: '陪產假',
    others: '其他',
    
    // Common
    loading: '載入中...',
    save: '儲存',
    cancel: '取消',
    edit: '編輯',
    delete: '刪除',
    create: '建立',
    update: '更新',
    submit: '提交',
    pending: '待審核',
    approved: '已批准',
    rejected: '已拒絕',
    newRequest: '新申請',
    newReport: '新報告',
    cashRequest: '現金申請',
    cashBalance: '現金餘額',
    
    // Tasks
    taskTitle: '任務標題',
    taskDescription: '描述',
    assignTo: '指派給',
    dueDate: '截止日期',
    priority: '優先級',
    status: '狀態',
    
    // Cash Control
    amount: '金額',
    currency: '貨幣',
    category: '類別',
    description: '描述',
    type: '類型',
    receiptUrl: '收據網址',
    receipt: '收據',
    cashControlTitle: '現金管理',
    totalRequested: '總申請金額',
    requestApproval: '申請批准',
    
    // Profile
    leaveBalances: '假期餘額',
    personalDetails: '個人詳情',
    profileChanges: '資料變更',
    requestChange: '申請變更',
    
    // Calendar
    leaveCalendar: '假期日曆',
    upcomingLeave: '即將到來的假期',
    colorLegend: '顏色圖例'
  },
  'zh-CN': {
    // Navigation
    dashboard: '仪表板',
    leaveRequests: '请假申请',
    calendar: '日历',
    profile: '个人资料',
    employees: '团队管理',
    reports: '报告',
    tasks: '任务',
    cashControl: '现金管理',
    settings: '设置',
    staffProfile: '员工资料',
    
    // Dashboard
    pendingRequests: '待审核申请',
    totalRequests: '总申请数',
    remainingDays: '剩余天数',
    usedDays: '已使用天数',
    daysRemaining: '剩余天数',
    daysUsed: '已使用天数',
    
    // Auth
    signIn: '登录',
    signUp: '注册',
    email: '电子邮件',
    password: '密码',
    firstName: '名字',
    lastName: '姓氏',
    employeeId: '员工编号',
    department: '部门',
    position: '职位',
    role: '角色',
    employee: '员工',
    manager: '高级管理层',
    hrAdmin: '管理员',
    
    // Leave Types
    sickLeave: '病假',
    vacation: '休假',
    maternity: '产假',
    paternity: '陪产假',
    others: '其他',
    
    // Common
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    edit: '编辑',
    delete: '删除',
    create: '创建',
    update: '更新',
    submit: '提交',
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
    newRequest: '新申请',
    newReport: '新报告',
    cashRequest: '现金申请',
    cashBalance: '现金余额',
    
    // Tasks
    taskTitle: '任务标题',
    taskDescription: '描述',
    assignTo: '分配给',
    dueDate: '截止日期',
    priority: '优先级',
    status: '状态',
    
    // Cash Control
    amount: '金额',
    currency: '货币',
    category: '类别',
    description: '描述',
    type: '类型',
    receiptUrl: '收据网址',
    receipt: '收据',
    cashControlTitle: '现金管理',
    totalRequested: '总申请金额',
    requestApproval: '申请批准',
    
    // Profile
    leaveBalances: '假期余额',
    personalDetails: '个人详情',
    profileChanges: '资料变更',
    requestChange: '申请变更',
    
    // Calendar
    leaveCalendar: '假期日历',
    upcomingLeave: '即将到来的假期',
    colorLegend: '颜色图例'
  },
  id: {
    // Navigation
    dashboard: 'Dasbor',
    leaveRequests: 'Permohonan Cuti',
    calendar: 'Kalender',
    profile: 'Profil',
    employees: 'Manajemen Tim',
    reports: 'Laporan',
    tasks: 'Tugas',
    cashControl: 'Kontrol Kas',
    settings: 'Pengaturan',
    staffProfile: 'Profil Staf',
    
    // Dashboard
    pendingRequests: 'Permintaan Tertunda',
    totalRequests: 'Total Permintaan',
    remainingDays: 'Hari Tersisa',
    usedDays: 'Hari Terpakai',
    daysRemaining: 'Hari Tersisa',
    daysUsed: 'Hari Terpakai',
    
    // Auth
    signIn: 'Masuk',
    signUp: 'Daftar',
    email: 'Email',
    password: 'Kata Sandi',
    firstName: 'Nama Depan',
    lastName: 'Nama Belakang',
    employeeId: 'ID Karyawan',
    department: 'Departemen',
    position: 'Posisi',
    role: 'Peran',
    employee: 'Karyawan',
    manager: 'Manajemen Senior',
    hrAdmin: 'Administrator',
    
    // Leave Types
    sickLeave: 'Cuti Sakit',
    vacation: 'Liburan',
    maternity: 'Cuti Melahirkan',
    paternity: 'Cuti Ayah',
    others: 'Lainnya',
    
    // Common
    loading: 'Memuat...',
    save: 'Simpan',
    cancel: 'Batal',
    edit: 'Ubah',
    delete: 'Hapus',
    create: 'Buat',
    update: 'Perbarui',
    submit: 'Kirim',
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    newRequest: 'Permintaan Baru',
    newReport: 'Laporan Baru',
    cashRequest: 'Permintaan Kas',
    cashBalance: 'Saldo Kas',
    
    // Tasks
    taskTitle: 'Judul Tugas',
    taskDescription: 'Deskripsi',
    assignTo: 'Tugaskan ke',
    dueDate: 'Tanggal Jatuh Tempo',
    priority: 'Prioritas',
    status: 'Status',
    
    // Cash Control
    amount: 'Jumlah',
    currency: 'Mata Uang',
    category: 'Kategori',
    description: 'Deskripsi',
    type: 'Jenis',
    receiptUrl: 'URL Tanda Terima',
    receipt: 'Tanda Terima',
    cashControlTitle: 'Kontrol Kas',
    totalRequested: 'Total Diminta',
    requestApproval: 'Persetujuan Permintaan',
    
    // Profile
    leaveBalances: 'Saldo Cuti',
    personalDetails: 'Detail Pribadi',
    profileChanges: 'Perubahan Profil',
    requestChange: 'Minta Perubahan',
    
    // Calendar
    leaveCalendar: 'Kalender Cuti',
    upcomingLeave: 'Cuti Mendatang',
    colorLegend: 'Legenda Warna'
  },
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};