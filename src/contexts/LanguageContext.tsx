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
    manager: 'Manager',
    hrAdmin: 'HR Admin',
    
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
    manager: '經理',
    hrAdmin: '人事管理員',
    
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
    manager: '经理',
    hrAdmin: '人事管理员',
    
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
    manager: 'Manajer',
    hrAdmin: 'Admin HR',
    
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