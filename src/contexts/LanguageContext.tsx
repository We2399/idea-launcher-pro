import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'zh-TW' | 'zh-CN' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    leaveRequests: 'Leave Requests',
    calendar: 'Calendar',
    profile: 'Profile',
    employees: 'Employees',
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
    leaveBalance: 'Leave Balance',
    overview: 'Overview',
    quickActions: 'Quick Actions',
    recentActivity: 'Recent Activity',
    upcomingLeave: 'Upcoming Leave',
    teamOverview: 'Team Overview',
    
    // Leave Requests
    startDate: 'Start Date',
    endDate: 'End Date',
    leaveType: 'Leave Type',
    daysRequested: 'Days Requested',
    reason: 'Reason',
    status: 'Status',
    requestDate: 'Request Date',
    approve: 'Approve',
    reject: 'Reject',
    cancel: 'Cancel',
    submit: 'Submit',
    save: 'Save',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    
    // Status Values
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
    seniorApproved: 'Senior Management Approved',
    
    // Leave Types
    annualLeave: 'Annual Leave',
    sickLeave: 'Sick Leave',
    maternityLeave: 'Maternity Leave',
    paternityLeave: 'Paternity Leave',
    vacation: 'Vacation',
    emergencyLeave: 'Emergency Leave',
    compassionateLeave: 'Compassionate Leave',
    studyLeave: 'Study Leave',
    unpaidLeave: 'Unpaid Leave',
    
    // View Modes
    myRequests: 'My Requests',
    teamRequests: 'Team Requests',
    allRequests: 'All Requests',
    
    // Placeholders and Labels
    selectLeaveType: 'Select Leave Type',
    selectCategory: 'Select Category',
    selectType: 'Select Type',
    selectStatus: 'Select Status',
    allTypes: 'All Types',
    allStatus: 'All Status',
    searchPlaceholder: 'Search by employee name, reason...',
    searchByEmployeeReason: 'Search by employee name, reason...',
    
    // Actions
    createRequest: 'Create Request',
    editRequest: 'Edit Request',
    deleteRequest: 'Delete Request',
    confirmDelete: 'Confirm Delete',
    approveRequest: 'Approve Request',
    rejectRequest: 'Reject Request',
    update: 'Update',
    bulkActions: 'Bulk Actions',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    export: 'Export',
    print: 'Print',
    
    // Messages
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    loading: 'Loading...',
    noData: 'No Data',
    noResults: 'No Results',
    
    // Categories
    general: 'General',
    travel: 'Travel',
    meals: 'Meals',
    supplies: 'Supplies',
    equipment: 'Equipment',
    training: 'Training',
    groceries: 'Groceries',
    others: 'Others',
    
    // Transaction Types
    request: 'Request',
    expense: 'Expense',
    reimbursement: 'Reimbursement',
    
    // Authentication
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password',
    
    // Profile page
    myProfile: 'My Profile',
    personalInformation: 'Personal Information',
    editProfile: 'Edit Profile',
    cancelEdit: 'Cancel',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    employeeId: 'Employee ID',
    department: 'Department',
    position: 'Position',
    selectDepartment: 'Select department',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    accountCreated: 'Account Created',
    leaveBalances: 'Leave Balances',
    report: 'Report',
    initialAllocation: 'Initial allocation',
    daysYear: 'days/year',
    used: 'Used',
    available: 'Available',
    noLeaveBalances: 'No leave balances configured for this year',
    profileNotFound: 'Profile not found',
    profileUpdateSuccess: 'Profile updated successfully',
    profileUpdateError: 'Failed to update profile',
    managePersonalInfo: 'Manage your personal information and view leave balances',
    
    // Leave Management
    leaveRequest: 'Leave Request',
    createLeaveRequest: 'Create Leave Request',
    submitLeaveRequest: 'Submit Leave Request',
    duration: 'Duration',
    day: 'Day',
    days: 'Days',
    reasonOptional: 'Reason (Optional)',
    reasonPlaceholder: 'Please provide a reason for your leave request...',
    requestSummary: 'Request Summary',
    submitting: 'Submitting...',
    requestSubmitted: 'Leave request submitted successfully',
    requestUpdated: 'Leave request updated successfully',
    requestDeleted: 'Leave request deleted successfully',
    endDateBeforeStart: 'End date cannot be before start date',
    overlappingDates: 'Leave dates overlap with an existing request',
    requiredField: 'Please fill in all required fields',
    operationFailed: 'Operation failed',
    
    // Department translations
    humanResources: 'Human Resources',
    engineering: 'Engineering',
    marketing: 'Marketing',
    sales: 'Sales',
    finance: 'Finance',
    operations: 'Operations',
    customerSupport: 'Customer Support',
    product: 'Product',
    legal: 'Legal',
    domesticHelper: 'Domestic Helper',
    unknown: 'Unknown',
    
    // Common actions
    add: 'Add',
    clear: 'Clear',
    search: 'Search',
    type: 'Type',
    requestStatus: 'Request status'
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
    leaveBalance: '休假餘額',
    overview: '概覽',
    quickActions: '快速操作',
    recentActivity: '最近活動',
    upcomingLeave: '即將到來的休假',
    teamOverview: '團隊概覽',
    
    // Leave Requests
    startDate: '開始日期',
    endDate: '結束日期',
    leaveType: '休假類型',
    daysRequested: '申請天數',
    reason: '原因',
    status: '狀態',
    requestDate: '申請日期',
    approve: '批准',
    reject: '拒絕',
    cancel: '取消',
    submit: '提交',
    save: '儲存',
    close: '關閉',
    edit: '編輯',
    delete: '刪除',
    
    // Status Values
    pending: '待審核',
    approved: '已批准',
    rejected: '已拒絕',
    paid: '已支付',
    seniorApproved: '高級管理層已批准',
    
    // Leave Types
    annualLeave: '年假',
    sickLeave: '病假',
    maternityLeave: '產假',
    paternityLeave: '陪產假',
    vacation: '休假',
    emergencyLeave: '緊急假',
    compassionateLeave: '恩恤假',
    studyLeave: '進修假',
    unpaidLeave: '無薪假',
    
    // View Modes
    myRequests: '我的申請',
    teamRequests: '團隊申請',
    allRequests: '所有申請',
    
    // Placeholders and Labels
    selectLeaveType: '選擇休假類型',
    selectCategory: '選擇類別',
    selectType: '選擇類型',
    selectStatus: '選擇狀態',
    allTypes: '所有類型',
    allStatus: '所有狀態',
    searchPlaceholder: '按員工姓名、原因搜索...',
    searchByEmployeeReason: '按員工姓名、原因搜索...',
    
    // Actions
    createRequest: '建立申請',
    editRequest: '編輯申請',
    deleteRequest: '刪除申請',
    confirmDelete: '確認刪除',
    approveRequest: '批准申請',
    rejectRequest: '拒絕申請',
    update: '更新',
    bulkActions: '批量操作',
    selectAll: '全選',
    deselectAll: '取消全選',
    export: '匯出',
    print: '列印',
    
    // Messages
    success: '成功',
    error: '錯誤',
    warning: '警告',
    info: '信息',
    loading: '載入中...',
    noData: '無數據',
    noResults: '無結果',
    
    // Categories
    general: '一般',
    travel: '差旅',
    meals: '餐費',
    supplies: '辦公用品',
    equipment: '設備',
    training: '培訓',
    groceries: '日用品',
    others: '其他',
    
    // Transaction Types
    request: '申請',
    expense: '支出',
    reimbursement: '報銷',
    
    // Authentication
    signIn: '登入',
    signOut: '登出',
    signUp: '註冊',
    password: '密碼',
    confirmPassword: '確認密碼',
    forgotPassword: '忘記密碼',
    resetPassword: '重設密碼',
    
    // Profile page
    myProfile: '我的個人資料',
    personalInformation: '個人資訊',
    editProfile: '編輯個人資料',
    cancelEdit: '取消',
    firstName: '名字',
    lastName: '姓氏',
    email: '電子郵件',
    employeeId: '員工編號',
    department: '部門',
    position: '職位',
    selectDepartment: '選擇部門',
    saveChanges: '儲存變更',
    saving: '儲存中...',
    accountCreated: '帳戶建立日期',
    leaveBalances: '休假餘額',
    report: '報告',
    initialAllocation: '初始分配',
    daysYear: '天/年',
    used: '已使用',
    available: '可用',
    noLeaveBalances: '本年度未配置休假餘額',
    profileNotFound: '找不到個人資料',
    profileUpdateSuccess: '個人資料更新成功',
    profileUpdateError: '更新個人資料失敗',
    managePersonalInfo: '管理您的個人資訊並查看休假餘額',
    
    // Leave Management
    leaveRequest: '休假申請',
    createLeaveRequest: '建立休假申請',
    submitLeaveRequest: '提交休假申請',
    duration: '時間長度',
    day: '日',
    days: '天',
    reasonOptional: '原因（可選）',
    reasonPlaceholder: '請提供您的休假申請原因...',
    requestSummary: '申請摘要',
    submitting: '提交中...',
    requestSubmitted: '休假申請提交成功',
    requestUpdated: '休假申請更新成功',
    requestDeleted: '休假申請刪除成功',
    endDateBeforeStart: '結束日期不能早於開始日期',
    overlappingDates: '休假日期與現有申請重複',
    requiredField: '請填寫所有必填欄位',
    operationFailed: '操作失敗',
    
    // Department translations
    humanResources: '人力資源',
    engineering: '工程部',
    marketing: '行銷部',
    sales: '銷售部',
    finance: '財務部',
    operations: '營運部',
    customerSupport: '客戶支援',
    product: '產品部',
    legal: '法務部',
    domesticHelper: '家庭助理',
    unknown: '未知',
    
    // Common actions
    add: '新增',
    clear: '清除',
    search: '搜尋',
    type: '類型',
    requestStatus: '申請狀態'
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
    leaveBalance: '休假余额',
    overview: '概览',
    quickActions: '快速操作',
    recentActivity: '最近活动',
    upcomingLeave: '即将到来的休假',
    teamOverview: '团队概览',
    
    // Leave Requests
    startDate: '开始日期',
    endDate: '结束日期',
    leaveType: '休假类型',
    daysRequested: '申请天数',
    reason: '原因',
    status: '状态',
    requestDate: '申请日期',
    approve: '批准',
    reject: '拒绝',
    cancel: '取消',
    submit: '提交',
    save: '保存',
    close: '关闭',
    edit: '编辑',
    delete: '删除',
    
    // Status Values
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
    paid: '已支付',
    seniorApproved: '高级管理层已批准',
    
    // Leave Types
    annualLeave: '年假',
    sickLeave: '病假',
    maternityLeave: '产假',
    paternityLeave: '陪产假',
    vacation: '休假',
    emergencyLeave: '紧急假',
    compassionateLeave: '恩恤假',
    studyLeave: '进修假',
    unpaidLeave: '无薪假',
    
    // View Modes
    myRequests: '我的申请',
    teamRequests: '团队申请',
    allRequests: '所有申请',
    
    // Placeholders and Labels
    selectLeaveType: '选择休假类型',
    selectCategory: '选择类别',
    selectType: '选择类型',
    selectStatus: '选择状态',
    allTypes: '所有类型',
    allStatus: '所有状态',
    searchPlaceholder: '按员工姓名、原因搜索...',
    searchByEmployeeReason: '按员工姓名、原因搜索...',
    
    // Actions
    createRequest: '创建申请',
    editRequest: '编辑申请',
    deleteRequest: '删除申请',
    confirmDelete: '确认删除',
    approveRequest: '批准申请',
    rejectRequest: '拒绝申请',
    update: '更新',
    bulkActions: '批量操作',
    selectAll: '全选',
    deselectAll: '取消全选',
    export: '导出',
    print: '打印',
    
    // Messages
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
    loading: '加载中...',
    noData: '无数据',
    noResults: '无结果',
    
    // Categories
    general: '一般',
    travel: '差旅',
    meals: '餐费',
    supplies: '办公用品',
    equipment: '设备',
    training: '培训',
    groceries: '日用品',
    others: '其他',
    
    // Transaction Types
    request: '申请',
    expense: '支出',
    reimbursement: '报销',
    
    // Authentication
    signIn: '登录',
    signOut: '登出',
    signUp: '注册',
    password: '密码',
    confirmPassword: '确认密码',
    forgotPassword: '忘记密码',
    resetPassword: '重设密码',
    
    // Profile page
    myProfile: '我的个人资料',
    personalInformation: '个人信息',
    editProfile: '编辑个人资料',
    cancelEdit: '取消',
    firstName: '名字',
    lastName: '姓氏',
    email: '电子邮件',
    employeeId: '员工编号',
    department: '部门',
    position: '职位',
    selectDepartment: '选择部门',
    saveChanges: '保存更改',
    saving: '保存中...',
    accountCreated: '账户创建日期',
    leaveBalances: '休假余额',
    report: '报告',
    initialAllocation: '初始分配',
    daysYear: '天/年',
    used: '已使用',
    available: '可用',
    noLeaveBalances: '本年度未配置休假余额',
    profileNotFound: '找不到个人资料',
    profileUpdateSuccess: '个人资料更新成功',
    profileUpdateError: '更新个人资料失败',
    managePersonalInfo: '管理您的个人信息并查看休假余额',
    
    // Leave Management
    leaveRequest: '休假申请',
    createLeaveRequest: '创建休假申请',
    submitLeaveRequest: '提交休假申请',
    duration: '持续时间',
    day: '日',
    days: '天',
    reasonOptional: '原因（可选）',
    reasonPlaceholder: '请提供您的休假申请原因...',
    requestSummary: '申请摘要',
    submitting: '提交中...',
    requestSubmitted: '休假申请提交成功',
    requestUpdated: '休假申请更新成功',
    requestDeleted: '休假申请删除成功',
    endDateBeforeStart: '结束日期不能早于开始日期',
    overlappingDates: '休假日期与现有申请重叠',
    requiredField: '请填写所有必填字段',
    operationFailed: '操作失败',
    
    // Department translations
    humanResources: '人力资源',
    engineering: '工程部',
    marketing: '市场部',
    sales: '销售部',
    finance: '财务部',
    operations: '运营部',
    customerSupport: '客户支持',
    product: '产品部',
    legal: '法务部',
    domesticHelper: '家政助理',
    unknown: '未知',
    
    // Common actions
    add: '添加',
    clear: '清除',
    search: '搜索',
    type: '类型',
    requestStatus: '申请状态'
  },
  id: {
    // Navigation
    dashboard: 'Dasbor',
    leaveRequests: 'Permohonan Cuti',
    calendar: 'Kalender',
    profile: 'Profil',
    employees: 'Karyawan',
    reports: 'Laporan',
    tasks: 'Tugas',
    cashControl: 'Kontrol Kas',
    settings: 'Pengaturan',
    staffProfile: 'Profil Staf',
    
    // Dashboard
    pendingRequests: 'Permintaan Tertunda',
    totalRequests: 'Total Permintaan',
    remainingDays: 'Sisa Hari',
    usedDays: 'Hari Terpakai',
    daysRemaining: 'Sisa Hari',
    daysUsed: 'Hari Terpakai',
    leaveBalance: 'Saldo Cuti',
    overview: 'Ikhtisar',
    quickActions: 'Tindakan Cepat',
    recentActivity: 'Aktivitas Terbaru',
    upcomingLeave: 'Cuti Mendatang',
    teamOverview: 'Ikhtisar Tim',
    
    // Leave Requests
    startDate: 'Tanggal Mulai',
    endDate: 'Tanggal Berakhir',
    leaveType: 'Jenis Cuti',
    daysRequested: 'Hari yang Diminta',
    reason: 'Alasan',
    status: 'Status',
    requestDate: 'Tanggal Permintaan',
    approve: 'Setujui',
    reject: 'Tolak',
    cancel: 'Batal',
    submit: 'Kirim',
    save: 'Simpan',
    close: 'Tutup',
    edit: 'Edit',
    delete: 'Hapus',
    
    // Status Values
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    paid: 'Dibayar',
    seniorApproved: 'Disetujui Manajemen Senior',
    
    // Leave Types
    annualLeave: 'Cuti Tahunan',
    sickLeave: 'Cuti Sakit',
    maternityLeave: 'Cuti Melahirkan',
    paternityLeave: 'Cuti Ayah',
    vacation: 'Liburan',
    emergencyLeave: 'Cuti Darurat',
    compassionateLeave: 'Cuti Duka',
    studyLeave: 'Cuti Belajar',
    unpaidLeave: 'Cuti Tanpa Gaji',
    
    // View Modes
    myRequests: 'Permintaan Saya',
    teamRequests: 'Permintaan Tim',
    allRequests: 'Semua Permintaan',
    
    // Placeholders and Labels
    selectLeaveType: 'Pilih Jenis Cuti',
    selectCategory: 'Pilih Kategori',
    selectType: 'Pilih Jenis',
    selectStatus: 'Pilih Status',
    allTypes: 'Semua Jenis',
    allStatus: 'Semua Status',
    searchPlaceholder: 'Cari berdasarkan nama karyawan, alasan...',
    searchByEmployeeReason: 'Cari berdasarkan nama karyawan, alasan...',
    
    // Actions
    createRequest: 'Buat Permintaan',
    editRequest: 'Edit Permintaan',
    deleteRequest: 'Hapus Permintaan',
    confirmDelete: 'Konfirmasi Hapus',
    approveRequest: 'Setujui Permintaan',
    rejectRequest: 'Tolak Permintaan',
    update: 'Perbarui',
    bulkActions: 'Tindakan Massal',
    selectAll: 'Pilih Semua',
    deselectAll: 'Batalkan Pilihan',
    export: 'Ekspor',
    print: 'Cetak',
    
    // Messages
    success: 'Sukses',
    error: 'Error',
    warning: 'Peringatan',
    info: 'Info',
    loading: 'Memuat...',
    noData: 'Tidak Ada Data',
    noResults: 'Tidak Ada Hasil',
    
    // Categories
    general: 'Umum',
    travel: 'Perjalanan',
    meals: 'Makan',
    supplies: 'Perlengkapan',
    equipment: 'Peralatan',
    training: 'Pelatihan',
    groceries: 'Kebutuhan Pokok',
    others: 'Lainnya',
    
    // Transaction Types
    request: 'Permintaan',
    expense: 'Pengeluaran',
    reimbursement: 'Penggantian',
    
    // Authentication
    signIn: 'Masuk',
    signOut: 'Keluar',
    signUp: 'Daftar',
    password: 'Kata Sandi',
    confirmPassword: 'Konfirmasi Kata Sandi',
    forgotPassword: 'Lupa Kata Sandi',
    resetPassword: 'Reset Kata Sandi',
    
    // Profile page
    myProfile: 'Profil Saya',
    personalInformation: 'Informasi Pribadi',
    editProfile: 'Edit Profil',
    cancelEdit: 'Batal',
    firstName: 'Nama Depan',
    lastName: 'Nama Belakang',
    email: 'Email',
    employeeId: 'ID Karyawan',
    department: 'Departemen',
    position: 'Posisi',
    selectDepartment: 'Pilih departemen',
    saveChanges: 'Simpan Perubahan',
    saving: 'Menyimpan...',
    accountCreated: 'Akun Dibuat',
    leaveBalances: 'Saldo Cuti',
    report: 'Laporan',
    initialAllocation: 'Alokasi awal',
    daysYear: 'hari/tahun',
    used: 'Digunakan',
    available: 'Tersedia',
    noLeaveBalances: 'Tidak ada saldo cuti yang dikonfigurasi untuk tahun ini',
    profileNotFound: 'Profil tidak ditemukan',
    profileUpdateSuccess: 'Profil berhasil diperbarui',
    profileUpdateError: 'Gagal memperbarui profil',
    managePersonalInfo: 'Kelola informasi pribadi Anda dan lihat saldo cuti',
    
    // Leave Management
    leaveRequest: 'Cuti',
    createLeaveRequest: 'Buat Permohonan Cuti',
    submitLeaveRequest: 'Kirim Permohonan Cuti',
    duration: 'Durasi',
    day: 'Hari',
    days: 'Hari',
    reasonOptional: 'Alasan (Opsional)',
    reasonPlaceholder: 'Silakan berikan alasan untuk permohonan cuti Anda...',
    requestSummary: 'Ringkasan Permohonan',
    submitting: 'Mengirim...',
    requestSubmitted: 'Permohonan cuti berhasil dikirim',
    requestUpdated: 'Permohonan cuti berhasil diperbarui',
    requestDeleted: 'Permohonan cuti berhasil dihapus',
    endDateBeforeStart: 'Tanggal berakhir tidak boleh sebelum tanggal mulai',
    overlappingDates: 'Tanggal cuti bertumpang tindih dengan permohonan yang sudah ada',
    requiredField: 'Harap isi semua field yang wajib diisi',
    operationFailed: 'Operasi gagal',
    
    // Department translations
    humanResources: 'Sumber Daya Manusia',
    engineering: 'Teknik',
    marketing: 'Pemasaran',
    sales: 'Penjualan',
    finance: 'Keuangan',
    operations: 'Operasional',
    customerSupport: 'Dukungan Pelanggan',
    product: 'Produk',
    legal: 'Hukum',
    domesticHelper: 'Asisten Rumah Tangga',
    unknown: 'Tidak Diketahui',
    
    // Common actions
    add: 'Tambah',
    clear: 'Bersihkan',
    search: 'Cari',
    type: 'Jenis',
    requestStatus: 'Status permintaan'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'zh-TW', 'zh-CN', 'id'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[Language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};