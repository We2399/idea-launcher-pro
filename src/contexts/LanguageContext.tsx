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
    colorLegend: 'Color Legend',
    myLeave: 'My Leave',
    teamLeave: 'Team Leave',
    allLeave: 'All Leave',
    
    // Extended Profile Fields
    idNumber: 'ID Number',
    passportNumber: 'Passport Number',
    visaNumber: 'Visa Number',
    dateOfBirth: 'Date of Birth',
    homeAddress: 'Home Address',
    maritalStatus: 'Marital Status',
    emergencyContact: 'Emergency Contact',
    emergencyPhone: 'Emergency Phone',
    nationality: 'Nationality',
    documents: 'Documents',
    uploadDocument: 'Upload Document',
    
    // Leave Request Management
    editRequest: 'Edit Request',
    deleteRequest: 'Delete Request',
    confirmDelete: 'Confirm Delete',
    areYouSure: 'Are you sure?',
    cannotBeUndone: 'This action cannot be undone',
    myLeaveRequests: 'My Leave Requests',
    teamLeaveRequests: 'Team Leave Requests',
    startDate: 'Start Date',
    endDate: 'End Date',
    leaveType: 'Leave Type',
    reason: 'Reason',
    daysRequested: 'Days Requested',
    requestStatus: 'Request Status',
    
    // Cash Control Extended
    personalView: 'Personal View',
    managementView: 'Management View',
    selectEmployee: 'Select Employee',
    approveRequest: 'Approve Request',
    rejectRequest: 'Reject Request',
    rejectionReason: 'Rejection Reason',
    cashTransactions: 'Cash Transactions',
    expenseReport: 'Expense Report',
    reimbursement: 'Reimbursement',
    
    // Tasks Extended
    createTask: 'Create Task',
    taskAssignment: 'Task Assignment',
    assignedBy: 'Assigned By',
    assignedTo: 'Assigned To',
    startTask: 'Start Task',
    completeTask: 'Complete Task',
    taskCompleted: 'Task Completed',
    
    // General Actions
    approve: 'Approve',
    reject: 'Reject',
    viewDetails: 'View Details',
    downloadFile: 'Download File',
    uploadFile: 'Upload File',
    selectFile: 'Select File',
    fileUploaded: 'File Uploaded',
    
    // Status Messages
    requestSubmitted: 'Request submitted successfully',
    requestUpdated: 'Request updated successfully',
    requestDeleted: 'Request deleted successfully',
    changesSaved: 'Changes saved successfully',
    operationFailed: 'Operation failed',
    accessDenied: 'Access denied',
    
    // Form Validation
    requiredField: 'This field is required',
    invalidDate: 'Invalid date',
    invalidAmount: 'Invalid amount',
    selectOption: 'Please select an option',
    
    // File Upload
    dragDropFiles: 'Drag and drop files here, or click to select',
    supportedFormats: 'Supported formats',
    maxFileSize: 'Maximum file size',
    uploading: 'Uploading...',
    uploadComplete: 'Upload complete',
    uploadFailed: 'Upload failed'
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
    colorLegend: '顏色圖例',
    myLeave: '我的假期',
    teamLeave: '團隊假期',
    allLeave: '所有假期',
    
    // Extended Profile Fields
    idNumber: '身份證號碼',
    passportNumber: '護照號碼',
    visaNumber: '簽證號碼',
    dateOfBirth: '出生日期',
    homeAddress: '家庭住址',
    maritalStatus: '婚姻狀況',
    emergencyContact: '緊急聯絡人',
    emergencyPhone: '緊急聯絡電話',
    nationality: '國籍',
    documents: '文件',
    uploadDocument: '上傳文件',
    
    // Leave Request Management
    editRequest: '編輯申請',
    deleteRequest: '刪除申請',
    confirmDelete: '確認刪除',
    areYouSure: '您確定嗎？',
    cannotBeUndone: '此操作無法撤銷',
    myLeaveRequests: '我的請假申請',
    teamLeaveRequests: '團隊請假申請',
    startDate: '開始日期',
    endDate: '結束日期',
    leaveType: '假期類型',
    reason: '原因',
    daysRequested: '申請天數',
    requestStatus: '申請狀態',
    
    // Cash Control Extended
    personalView: '個人視圖',
    managementView: '管理視圖',
    selectEmployee: '選擇員工',
    approveRequest: '批准申請',
    rejectRequest: '拒絕申請',
    rejectionReason: '拒絕原因',
    cashTransactions: '現金交易',
    expenseReport: '費用報告',
    reimbursement: '報銷',
    
    // Tasks Extended
    createTask: '建立任務',
    taskAssignment: '任務分配',
    assignedBy: '分配者',
    assignedTo: '分配給',
    startTask: '開始任務',
    completeTask: '完成任務',
    taskCompleted: '任務已完成',
    
    // General Actions
    approve: '批准',
    reject: '拒絕',
    viewDetails: '查看詳情',
    downloadFile: '下載文件',
    uploadFile: '上傳文件',
    selectFile: '選擇文件',
    fileUploaded: '文件已上傳',
    
    // Status Messages
    requestSubmitted: '申請提交成功',
    requestUpdated: '申請更新成功',
    requestDeleted: '申請刪除成功',
    changesSaved: '更改保存成功',
    operationFailed: '操作失敗',
    accessDenied: '存取被拒',
    
    // Form Validation
    requiredField: '此字段為必填項',
    invalidDate: '無效日期',
    invalidAmount: '無效金額',
    selectOption: '請選擇選項',
    
    // File Upload
    dragDropFiles: '拖放文件到此處，或點擊選擇',
    supportedFormats: '支持的格式',
    maxFileSize: '最大文件大小',
    uploading: '上傳中...',
    uploadComplete: '上傳完成',
    uploadFailed: '上傳失敗'
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
    colorLegend: '颜色图例',
    myLeave: '我的假期',
    teamLeave: '团队假期',
    allLeave: '所有假期',
    
    // Extended Profile Fields
    idNumber: '身份证号码',
    passportNumber: '护照号码',
    visaNumber: '签证号码',
    dateOfBirth: '出生日期',
    homeAddress: '家庭住址',
    maritalStatus: '婚姻状况',
    emergencyContact: '紧急联系人',
    emergencyPhone: '紧急联系电话',
    nationality: '国籍',
    documents: '文件',
    uploadDocument: '上传文件',
    
    // Leave Request Management
    editRequest: '编辑申请',
    deleteRequest: '删除申请',
    confirmDelete: '确认删除',
    areYouSure: '您确定吗？',
    cannotBeUndone: '此操作无法撤销',
    myLeaveRequests: '我的请假申请',
    teamLeaveRequests: '团队请假申请',
    startDate: '开始日期',
    endDate: '结束日期',
    leaveType: '假期类型',
    reason: '原因',
    daysRequested: '申请天数',
    requestStatus: '申请状态',
    
    // Cash Control Extended
    personalView: '个人视图',
    managementView: '管理视图',
    selectEmployee: '选择员工',
    approveRequest: '批准申请',
    rejectRequest: '拒绝申请',
    rejectionReason: '拒绝原因',
    cashTransactions: '现金交易',
    expenseReport: '费用报告',
    reimbursement: '报销',
    
    // Tasks Extended
    createTask: '创建任务',
    taskAssignment: '任务分配',
    assignedBy: '分配者',
    assignedTo: '分配给',
    startTask: '开始任务',
    completeTask: '完成任务',
    taskCompleted: '任务已完成',
    
    // General Actions
    approve: '批准',
    reject: '拒绝',
    viewDetails: '查看详情',
    downloadFile: '下载文件',
    uploadFile: '上传文件',
    selectFile: '选择文件',
    fileUploaded: '文件已上传',
    
    // Status Messages
    requestSubmitted: '申请提交成功',
    requestUpdated: '申请更新成功',
    requestDeleted: '申请删除成功',
    changesSaved: '更改保存成功',
    operationFailed: '操作失败',
    accessDenied: '访问被拒',
    
    // Form Validation
    requiredField: '此字段为必填项',
    invalidDate: '无效日期',
    invalidAmount: '无效金额',
    selectOption: '请选择选项',
    
    // File Upload
    dragDropFiles: '拖放文件到此处，或点击选择',
    supportedFormats: '支持的格式',
    maxFileSize: '最大文件大小',
    uploading: '上传中...',
    uploadComplete: '上传完成',
    uploadFailed: '上传失败'
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
    colorLegend: 'Legenda Warna',
    myLeave: 'Cuti Saya',
    teamLeave: 'Cuti Tim',
    allLeave: 'Semua Cuti',
    
    // Extended Profile Fields
    idNumber: 'Nomor KTP',
    passportNumber: 'Nomor Paspor',
    visaNumber: 'Nomor Visa',
    dateOfBirth: 'Tanggal Lahir',
    homeAddress: 'Alamat Rumah',
    maritalStatus: 'Status Pernikahan',
    emergencyContact: 'Kontak Darurat',
    emergencyPhone: 'Telepon Darurat',
    nationality: 'Kewarganegaraan',
    documents: 'Dokumen',
    uploadDocument: 'Unggah Dokumen',
    
    // Leave Request Management
    editRequest: 'Edit Permohonan',
    deleteRequest: 'Hapus Permohonan',
    confirmDelete: 'Konfirmasi Hapus',
    areYouSure: 'Apakah Anda yakin?',
    cannotBeUndone: 'Tindakan ini tidak bisa dibatalkan',
    myLeaveRequests: 'Permohonan Cuti Saya',
    teamLeaveRequests: 'Permohonan Cuti Tim',
    startDate: 'Tanggal Mulai',
    endDate: 'Tanggal Selesai',
    leaveType: 'Jenis Cuti',
    reason: 'Alasan',
    daysRequested: 'Hari Diminta',
    requestStatus: 'Status Permohonan',
    
    // Cash Control Extended
    personalView: 'Tampilan Pribadi',
    managementView: 'Tampilan Manajemen',
    selectEmployee: 'Pilih Karyawan',
    approveRequest: 'Setujui Permohonan',
    rejectRequest: 'Tolak Permohonan',
    rejectionReason: 'Alasan Penolakan',
    cashTransactions: 'Transaksi Kas',
    expenseReport: 'Laporan Pengeluaran',
    reimbursement: 'Penggantian',
    
    // Tasks Extended
    createTask: 'Buat Tugas',
    taskAssignment: 'Penugasan Tugas',
    assignedBy: 'Ditugaskan Oleh',
    assignedTo: 'Ditugaskan Kepada',
    startTask: 'Mulai Tugas',
    completeTask: 'Selesaikan Tugas',
    taskCompleted: 'Tugas Selesai',
    
    // General Actions
    approve: 'Setujui',
    reject: 'Tolak',
    viewDetails: 'Lihat Detail',
    downloadFile: 'Unduh File',
    uploadFile: 'Unggah File',
    selectFile: 'Pilih File',
    fileUploaded: 'File Terunggah',
    
    // Status Messages
    requestSubmitted: 'Permohonan berhasil dikirim',
    requestUpdated: 'Permohonan berhasil diperbarui',
    requestDeleted: 'Permohonan berhasil dihapus',
    changesSaved: 'Perubahan berhasil disimpan',
    operationFailed: 'Operasi gagal',
    accessDenied: 'Akses ditolak',
    
    // Form Validation
    requiredField: 'Field ini wajib diisi',
    invalidDate: 'Tanggal tidak valid',
    invalidAmount: 'Jumlah tidak valid',
    selectOption: 'Pilih opsi',
    
    // File Upload
    dragDropFiles: 'Seret dan lepas file di sini, atau klik untuk memilih',
    supportedFormats: 'Format yang didukung',
    maxFileSize: 'Ukuran file maksimum',
    uploading: 'Mengunggah...',
    uploadComplete: 'Unggah selesai',
    uploadFailed: 'Unggah gagal'
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