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
    leaveBalances: 'Leave Balances',
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
    view: 'View',
    filter: 'Filter',
    search: 'Search',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    all: 'All',
    newRequest: 'New Request',
    leaveRequest: 'Leave Request',
    requestLeave: 'Request Leave',
    
    // Profile
    personalDetails: 'Personal Details',
    profileChanges: 'Profile Changes',
    requestChange: 'Request Change',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    department: 'Department',
    position: 'Position',
    employeeId: 'Employee ID',
    manager: 'Manager',
    joinDate: 'Join Date',
    
    // Leave Management
    myLeave: 'My Leave',
    teamLeave: 'Team Leave',
    allLeave: 'All Leave',
    leaveHistory: 'Leave History',
    leaveCalendar: 'Leave Calendar',
    colorLegend: 'Color Legend',
    
    // Leave Types
    vacation: 'Vacation',
    sickLeave: 'Sick Leave',
    maternityLeave: 'Maternity Leave',
    paternityLeave: 'Paternity Leave',
    annualLeave: 'Annual Leave',
    emergencyLeave: 'Emergency Leave',
    compassionateLeave: 'Compassionate Leave',
    studyLeave: 'Study Leave',
    unpaidLeave: 'Unpaid Leave',
    others: 'Others',
    
    // Cash Control Categories
    general: 'General',
    travel: 'Travel',
    meals: 'Meals',
    supplies: 'Office Supplies',
    equipment: 'Equipment',
    training: 'Training',
    groceries: 'Groceries',
    
    // Transaction Types
    request: 'Request',
    expense: 'Expense',
    reimbursement: 'Reimbursement',
    
    // Status Values
    seniorApproved: 'Senior Approved',
    
    // View Modes
    myRequests: 'My Requests',
    teamRequests: 'Team Requests',
    allRequests: 'All Requests',
    
    // Placeholders and Labels  
    selectLeaveType: 'Select leave type',
    selectCategory: 'Select category',
    selectType: 'Select type',
    selectStatus: 'Select status',
    allTypes: 'All Types',
    allStatus: 'All Status',
    searchPlaceholder: 'Search by employee name, reason...',
    receiptUploaded: 'Receipt uploaded successfully',
    orEnterUrl: 'Or enter receipt URL manually',
    clear: 'Clear',
    newRequestReport: 'NEW REQUEST/REPORT',
    createCashRequest: 'Create Cash Request',
    submitCashRequest: 'Submit a new cash request or expense report',
    submitLeaveRequest: 'Submit Request',
    submitting: 'Submitting...',
    requestSummary: 'Request Summary',
    duration: 'Duration',
    days: 'days',
    day: 'day',
    reasonOptional: 'Reason (Optional)',
    reasonPlaceholder: 'Enter reason for leave request...',
    
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
    info: 'Information',
    loading: 'Loading...',
    noData: 'No data available',
    noResults: 'No results found',
    
    // Forms
    required: 'Required',
    optional: 'Optional',
    pleaseSelect: 'Please select',
    enterValue: 'Enter value',
    
    // Cash Control
    cashControlTitle: 'Cash Control',
    cashRequest: 'Cash Request',
    expenseReport: 'Expense Report',
    amount: 'Amount',
    currency: 'Currency',
    category: 'Category',
    description: 'Description',
    receipt: 'Receipt',
    uploadReceipt: 'Upload Receipt',
    
    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    
    // Authentication
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password',
    
    // Tasks
    task: 'Task',
    title: 'Title',
    assignee: 'Assignee',
    dueDate: 'Due Date',
    priority: 'Priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    completed: 'Completed',
    inProgress: 'In Progress',
    notStarted: 'Not Started',
    
    // Notifications
    requestApproved: 'Request approved successfully',
    requestRejected: 'Request rejected successfully',
    requestSubmitted: 'Request submitted successfully',
    requestUpdated: 'Request updated successfully',
    requestDeleted: 'Request deleted successfully',
    changesSaved: 'Changes saved successfully',
    uploadSuccess: 'Upload successful',
    
    // Errors
    invalidInput: 'Invalid input',
    networkError: 'Network error',
    serverError: 'Server error',
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
    uploadFailed: 'Upload failed',
    
    // Extended Profile Fields
    idNumber: 'ID Number',
    passportNumber: 'Passport Number', 
    visaNumber: 'Visa Number',
    dateOfBirth: 'Date of Birth',
    homeAddress: 'Home Address',
    maritalStatus: 'Marital Status',    
    emergencyContactName: 'Emergency Contact Name',
    emergencyContactPhone: 'Emergency Contact Phone',
    phoneNumber: 'Phone Number',
    single: 'Single',
    married: 'Married',
    divorced: 'Divorced',
    widowed: 'Widowed',
    
    // Document Management - New unique keys only  
    documents: 'Documents',
    uploadDocument: 'Upload Document',
    documentType: 'Document Type',
    selectDocumentType: 'Select Document Type',
    passport: 'Passport',
    idCard: 'ID Card',
    visa: 'Visa',
    certificate: 'Certificate',
    contract: 'Contract',
    viewDocument: 'View Document',
    deleteDocument: 'Delete Document',
    documentUploaded: 'Document uploaded successfully',
    documentDeleted: 'Document deleted successfully',
    noDocuments: 'No documents uploaded',
    
    // Calendar Interactions - New unique keys only
    createLeaveRequest: 'Create Leave Request',
    clickToCreateLeave: 'Click on a date to create a leave request',
    editLeaveRequest: 'Edit Leave Request',
    deleteLeaveRequest: 'Delete Leave Request', 
    confirmDeleteLeave: 'Are you sure you want to delete this leave request?',
    cannotEditApproved: 'Cannot edit approved requests',
    leaveUpdated: 'Leave request updated successfully',
    leaveDeleted: 'Leave request deleted successfully',
    
    // Cash Control Dual Role - New unique keys only
    personalView: 'Personal View',
    managementView: 'Management View',
    selectEmployee: 'Select Employee',
    allEmployees: 'All Employees',
    teamTransactions: 'Team Transactions',
    bulkApprove: 'Bulk Approve',
    filterByStatus: 'Filter by Status',
    filterByEmployee: 'Filter by Employee',
    approvalWorkflow: 'Approval Workflow'
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
    leaveBalances: '休假餘額',
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
    view: '查看',
    filter: '篩選',
    search: '搜尋',
    pending: '待審核',
    approved: '已批准',
    rejected: '已拒絕',
    all: '全部',
    newRequest: '新申請',
    leaveRequest: '請假申請',
    requestLeave: '申請休假',
    
    // Profile
    personalDetails: '個人詳細資料',
    profileChanges: '個人資料變更',
    requestChange: '申請變更',
    firstName: '名字',
    lastName: '姓氏',
    email: '電子郵件',
    department: '部門',
    position: '職位',
    employeeId: '員工編號',
    manager: '主管',
    joinDate: '入職日期',
    
    // Leave Management
    myLeave: '我的休假',
    teamLeave: '團隊休假',
    allLeave: '所有休假',
    leaveHistory: '休假記錄',
    leaveCalendar: '休假行事曆',
    colorLegend: '顏色圖例',
    
    // Leave Types
    vacation: '假期',
    sickLeave: '病假',
    maternityLeave: '產假',
    paternityLeave: '陪產假',
    annualLeave: '年假',
    emergencyLeave: '緊急假',
    compassionateLeave: '恩恤假',
    studyLeave: '進修假',
    unpaidLeave: '無薪假',
    others: '其他',
    
    // Cash Control Categories
    general: '一般',
    travel: '交通',
    meals: '膳食',
    supplies: '辦公用品',
    equipment: '設備',
    training: '培訓',
    groceries: '日用品',
    
    // Transaction Types
    request: '申請',
    expense: '支出',
    reimbursement: '報銷',
    
    // Status Values
    seniorApproved: '高級管理層已批准',
    
    // View Modes
    myRequests: '我的申請',
    teamRequests: '團隊申請',
    allRequests: '所有申請',
    
    // Placeholders and Labels
    selectLeaveType: '選擇假期類型',
    selectCategory: '選擇類別',
    selectType: '選擇類型',
    selectStatus: '選擇狀態',
    allTypes: '所有類型',
    allStatus: '所有狀態',
    searchPlaceholder: '按員工姓名、原因搜索...',
    receiptUploaded: '收據上傳成功',
    orEnterUrl: '或手動輸入收據網址',
    clear: '清除',
    newRequestReport: '新申請/報告',
    createCashRequest: '創建現金申請',
    submitCashRequest: '提交新的現金申請或支出報告',
    submitLeaveRequest: '提交申請',
    submitting: '提交中...',
    requestSummary: '申請摘要',
    duration: '持續時間',
    days: '天',
    day: '天',
    reasonOptional: '原因（可選）',
    reasonPlaceholder: '輸入假期申請原因...',
    
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
    info: '資訊',
    loading: '載入中...',
    noData: '無資料',
    noResults: '無結果',
    
    // Forms
    required: '必填',
    optional: '選填',
    pleaseSelect: '請選擇',
    enterValue: '請輸入數值',
    
    // Cash Control
    cashControlTitle: '現金管理',
    cashRequest: '現金申請',
    expenseReport: '費用報告',
    amount: '金額',
    currency: '貨幣',
    category: '類別',
    description: '描述',
    receipt: '收據',
    uploadReceipt: '上傳收據',
    
    // Time
    today: '今天',
    yesterday: '昨天',
    thisWeek: '本週',
    thisMonth: '本月',
    thisYear: '今年',
    
    // Authentication
    signIn: '登入',
    signOut: '登出',
    signUp: '註冊',
    password: '密碼',
    confirmPassword: '確認密碼',
    forgotPassword: '忘記密碼',
    resetPassword: '重設密碼',
    
    // Tasks
    task: '任務',
    title: '標題',
    assignee: '指派人',
    dueDate: '到期日',
    priority: '優先順序',
    high: '高',
    medium: '中',
    low: '低',
    completed: '已完成',
    inProgress: '進行中',
    notStarted: '未開始',
    
    // Notifications
    requestApproved: '申請已成功批准',
    requestRejected: '申請已成功拒絕',
    requestSubmitted: '申請已成功提交',
    requestUpdated: '申請已成功更新',
    requestDeleted: '申請已成功刪除',
    changesSaved: '更改已成功儲存',
    uploadSuccess: '上傳成功',
    
    // Errors
    invalidInput: '輸入無效',
    networkError: '網路錯誤',
    serverError: '伺服器錯誤',
    accessDenied: '存取被拒絕',
    
    // Form Validation
    requiredField: '此欄位為必填',
    invalidDate: '日期無效',
    invalidAmount: '金額無效',
    selectOption: '請選擇選項',
    
    // File Upload (Traditional Chinese)
    dragDropFiles: '拖放檔案到此處，或點擊選擇',
    supportedFormats: '支援格式',
    maxFileSize: '最大檔案大小',
    uploading: '上傳中...',
    uploadComplete: '上傳完成',
    uploadFailed: '上傳失敗',
    
    // Extended Profile Fields (Traditional Chinese)
    idNumber: '身份證號碼',
    passportNumber: '護照號碼',
    visaNumber: '簽證號碼',
    dateOfBirth: '出生日期',
    homeAddress: '住址',
    maritalStatus: '婚姻狀況',
    emergencyContactName: '緊急聯絡人姓名',
    emergencyContactPhone: '緊急聯絡人電話',
    phoneNumber: '電話號碼',
    single: '單身',
    married: '已婚',
    divorced: '離婚',
    widowed: '寡居',
    
    // Document Management
    documents: '文件',
    uploadDocument: '上傳文件',
    documentType: '文件類型',
    selectDocumentType: '選擇文件類型',
    passport: '護照',
    idCard: '身份證',
    visa: '簽證',
    certificate: '證書',
    contract: '合約',
    viewDocument: '查看文件',
    deleteDocument: '刪除文件',
    documentUploaded: '文件上傳成功',
    documentDeleted: '文件刪除成功',
    noDocuments: '沒有上傳的文件',
    
    // Calendar Interactions
    createLeaveRequest: '建立請假申請',
    clickToCreateLeave: '點擊日期以建立請假申請',
    editLeaveRequest: '編輯請假申請',
    deleteLeaveRequest: '刪除請假申請',
    confirmDeleteLeave: '確定要刪除此請假申請嗎？',
    cannotEditApproved: '無法編輯已批准的申請',
    leaveUpdated: '請假申請更新成功',
    leaveDeleted: '請假申請刪除成功',
    
    // Cash Control Dual Role
    personalView: '個人檢視',
    managementView: '管理檢視',  
    selectEmployee: '選擇員工',
    allEmployees: '所有員工',
    teamTransactions: '團隊交易',
    bulkApprove: '批量批准',
    filterByStatus: '按狀態篩選',
    filterByEmployee: '按員工篩選',
    approvalWorkflow: '批准流程'
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
    leaveBalances: '休假余额',
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
    view: '查看',
    filter: '筛选',
    search: '搜索',
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
    all: '全部',
    newRequest: '新申请',
    leaveRequest: '请假申请',
    requestLeave: '申请休假',
    
    // Profile
    personalDetails: '个人详细资料',
    profileChanges: '个人资料变更',
    requestChange: '申请变更',
    firstName: '名字',
    lastName: '姓氏',
    email: '电子邮件',
    department: '部门',
    position: '职位',
    employeeId: '员工编号',
    manager: '主管',
    joinDate: '入职日期',
    
    // Leave Management
    myLeave: '我的休假',
    teamLeave: '团队休假',
    allLeave: '所有休假',
    leaveHistory: '休假记录',
    leaveCalendar: '休假日历',
    colorLegend: '颜色图例',
    
    // Leave Types
    vacation: '假期',
    sickLeave: '病假',
    maternityLeave: '产假',
    paternityLeave: '陪产假',
    annualLeave: '年假',
    emergencyLeave: '紧急假',
    compassionateLeave: '恩恤假',
    studyLeave: '进修假',
    unpaidLeave: '无薪假',
    others: '其他',
    
    // Cash Control Categories
    general: '一般',
    travel: '交通',
    meals: '膳食',
    supplies: '办公用品',
    equipment: '设备',
    training: '培训',
    groceries: '日用品',
    
    // Transaction Types
    request: '申请',
    expense: '支出',
    reimbursement: '报销',
    
    // Status Values
    seniorApproved: '高级管理层已批准',
    
    // View Modes
    myRequests: '我的申请',
    teamRequests: '团队申请',
    allRequests: '所有申请',
    
    // Placeholders and Labels
    selectLeaveType: '选择假期类型',
    selectCategory: '选择类别',
    selectType: '选择类型',
    selectStatus: '选择状态',
    allTypes: '所有类型',
    allStatus: '所有状态',
    searchPlaceholder: '按员工姓名、原因搜索...',
    receiptUploaded: '收据上传成功',
    orEnterUrl: '或手动输入收据网址',
    clear: '清除',
    newRequestReport: '新申请/报告',
    createCashRequest: '创建现金申请',
    submitCashRequest: '提交新的现金申请或支出报告',
    submitLeaveRequest: '提交申请',
    submitting: '提交中...',
    requestSummary: '申请摘要',
    duration: '持续时间',
    days: '天',
    day: '天',
    reasonOptional: '原因（可选）',
    reasonPlaceholder: '输入假期申请原因...',
    
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
    
    // Forms
    required: '必填',
    optional: '选填',
    pleaseSelect: '请选择',
    enterValue: '请输入数值',
    
    // Cash Control
    cashControlTitle: '现金管理',
    cashRequest: '现金申请',
    expenseReport: '费用报告',
    amount: '金额',
    currency: '货币',
    category: '类别',
    description: '描述',
    receipt: '收据',
    uploadReceipt: '上传收据',
    
    // Time
    today: '今天',
    yesterday: '昨天',
    thisWeek: '本周',
    thisMonth: '本月',
    thisYear: '今年',
    
    // Authentication
    signIn: '登录',
    signOut: '登出',
    signUp: '注册',
    password: '密码',
    confirmPassword: '确认密码',
    forgotPassword: '忘记密码',
    resetPassword: '重置密码',
    
    // Tasks
    task: '任务',
    title: '标题',
    assignee: '指派人',
    dueDate: '到期日',
    priority: '优先级',
    high: '高',
    medium: '中',
    low: '低',
    completed: '已完成',
    inProgress: '进行中',
    notStarted: '未开始',
    
    // Notifications
    requestApproved: '申请已成功批准',
    requestRejected: '申请已成功拒绝',
    requestSubmitted: '申请已成功提交',
    requestUpdated: '申请已成功更新',
    requestDeleted: '申请已成功删除',
    changesSaved: '更改已成功保存',
    uploadSuccess: '上传成功',
    
    // Errors
    invalidInput: '输入无效',
    networkError: '网络错误',
    serverError: '服务器错误',
    accessDenied: '访问被拒绝',
    
    // Form Validation
    requiredField: '此字段为必填',
    invalidDate: '日期无效',
    invalidAmount: '金额无效',
    selectOption: '请选择选项',
    
    // File Upload (Simplified Chinese)
    dragDropFiles: '拖放文件到此处，或点击选择',
    supportedFormats: '支持格式',
    maxFileSize: '最大文件大小',
    uploading: '上传中...',
    uploadComplete: '上传完成',
    uploadFailed: '上传失败',
    
    // Extended Profile Fields (Simplified Chinese)
    idNumber: '身份证号码',
    passportNumber: '护照号码',
    visaNumber: '签证号码',
    dateOfBirth: '出生日期',
    homeAddress: '住址',
    maritalStatus: '婚姻状况',
    emergencyContactName: '紧急联系人姓名',  
    emergencyContactPhone: '紧急联系人电话',
    phoneNumber: '电话号码',
    single: '单身',
    married: '已婚',
    divorced: '离婚',
    widowed: '丧偶',
    
    // Document Management
    documents: '文件',
    uploadDocument: '上传文件',
    documentType: '文件类型',
    selectDocumentType: '选择文件类型',
    passport: '护照',
    idCard: '身份证',
    visa: '签证',
    certificate: '证书',
    contract: '合同',
    viewDocument: '查看文件',
    deleteDocument: '删除文件',
    documentUploaded: '文件上传成功',
    documentDeleted: '文件删除成功',
    noDocuments: '没有上传的文件',
    
    // Calendar Interactions
    createLeaveRequest: '创建请假申请',
    clickToCreateLeave: '点击日期以创建请假申请',
    editLeaveRequest: '编辑请假申请',
    deleteLeaveRequest: '删除请假申请',
    confirmDeleteLeave: '确定要删除此请假申请吗？',
    cannotEditApproved: '无法编辑已批准的申请',
    leaveUpdated: '请假申请更新成功',
    leaveDeleted: '请假申请删除成功',
    
    // Cash Control Dual Role
    personalView: '个人视图',
    managementView: '管理视图',
    selectEmployee: '选择员工',
    allEmployees: '所有员工',
    teamTransactions: '团队交易',
    bulkApprove: '批量批准',
    filterByStatus: '按状态筛选',
    filterByEmployee: '按员工筛选',
    approvalWorkflow: '审批流程'
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
    leaveBalances: 'Saldo Cuti',
    overview: 'Ikhtisar',
    quickActions: 'Tindakan Cepat',
    recentActivity: 'Aktivitas Terbaru',
    upcomingLeave: 'Cuti Mendatang',
    teamOverview: 'Ikhtisar Tim',
    
    // Leave Requests
    startDate: 'Tanggal Mulai',
    endDate: 'Tanggal Selesai',
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
    edit: 'Ubah',
    delete: 'Hapus',
    view: 'Lihat',
    filter: 'Filter',
    search: 'Cari',
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    all: 'Semua',
    newRequest: 'Permintaan Baru',
    leaveRequest: 'Permohonan Cuti',
    requestLeave: 'Ajukan Cuti',
    
    // Profile
    personalDetails: 'Detail Pribadi',
    profileChanges: 'Perubahan Profil',
    requestChange: 'Minta Perubahan',
    firstName: 'Nama Depan',
    lastName: 'Nama Belakang',
    email: 'Email',
    department: 'Departemen',
    position: 'Posisi',
    employeeId: 'ID Karyawan',
    manager: 'Manajer',
    joinDate: 'Tanggal Bergabung',
    
    // Leave Management
    myLeave: 'Cuti Saya',
    teamLeave: 'Cuti Tim',
    allLeave: 'Semua Cuti',
    leaveHistory: 'Riwayat Cuti',
    leaveCalendar: 'Kalender Cuti',
    colorLegend: 'Legenda Warna',
    
    // Leave Types
    vacation: 'Liburan',
    sickLeave: 'Cuti Sakit',
    maternityLeave: 'Cuti Melahirkan',
    paternityLeave: 'Cuti Ayah',
    annualLeave: 'Cuti Tahunan',
    emergencyLeave: 'Cuti Darurat',
    compassionateLeave: 'Cuti Bela Sungkawa',
    studyLeave: 'Cuti Belajar',
    unpaidLeave: 'Cuti Tanpa Gaji',
    others: 'Lainnya',
    
    // Cash Control Categories
    general: 'Umum',
    travel: 'Perjalanan',
    meals: 'Makanan',
    supplies: 'Perlengkapan Kantor',
    equipment: 'Peralatan',
    training: 'Pelatihan',
    groceries: 'Bahan Makanan',
    
    // Transaction Types
    request: 'Permintaan',
    expense: 'Pengeluaran',
    reimbursement: 'Penggantian',
    
    // Status Values
    seniorApproved: 'Disetujui Manajemen Senior',
    
    // View Modes
    myRequests: 'Permintaan Saya',
    teamRequests: 'Permintaan Tim',
    allRequests: 'Semua Permintaan',
    
    // Placeholders and Labels
    selectLeaveType: 'Pilih jenis cuti',
    selectCategory: 'Pilih kategori',
    selectType: 'Pilih jenis',
    selectStatus: 'Pilih status',
    allTypes: 'Semua Jenis',
    allStatus: 'Semua Status',
    searchPlaceholder: 'Cari berdasarkan nama karyawan, alasan...',
    receiptUploaded: 'Kwitansi berhasil diunggah',
    orEnterUrl: 'Atau masukkan URL kwitansi secara manual',
    clear: 'Hapus',
    newRequestReport: 'PERMINTAAN/LAPORAN BARU',
    createCashRequest: 'Buat Permintaan Uang Tunai',
    submitCashRequest: 'Kirim permintaan uang tunai atau laporan pengeluaran baru',
    submitLeaveRequest: 'Kirim Permintaan',
    submitting: 'Mengirim...',
    requestSummary: 'Ringkasan Permintaan',
    duration: 'Durasi',
    days: 'hari',
    day: 'hari',
    reasonOptional: 'Alasan (Opsional)',
    reasonPlaceholder: 'Masukkan alasan permintaan cuti...',
    
    // Actions
    createRequest: 'Buat Permintaan',
    editRequest: 'Edit Permohonan',
    deleteRequest: 'Hapus Permohonan',
    confirmDelete: 'Konfirmasi Hapus',
    approveRequest: 'Setujui Permintaan',
    rejectRequest: 'Tolak Permintaan',
    update: 'Perbarui',
    bulkActions: 'Tindakan Massal',
    selectAll: 'Pilih Semua',
    deselectAll: 'Batal Pilih Semua',
    export: 'Ekspor',
    print: 'Cetak',
    
    // Messages
    success: 'Berhasil',
    error: 'Error',
    warning: 'Peringatan',
    info: 'Informasi',
    loading: 'Memuat...',
    noData: 'Tidak ada data',
    noResults: 'Tidak ada hasil',
    
    // Forms
    required: 'Wajib',
    optional: 'Opsional',
    pleaseSelect: 'Silakan pilih',
    enterValue: 'Masukkan nilai',
    
    // Cash Control
    cashControlTitle: 'Kontrol Kas',
    cashRequest: 'Permintaan Kas',
    expenseReport: 'Laporan Pengeluaran',
    amount: 'Jumlah',
    currency: 'Mata Uang',
    category: 'Kategori',
    description: 'Deskripsi',
    receipt: 'Kwitansi',
    uploadReceipt: 'Unggah Kwitansi',
    
    // Time
    today: 'Hari Ini',
    yesterday: 'Kemarin',
    thisWeek: 'Minggu Ini',
    thisMonth: 'Bulan Ini',
    thisYear: 'Tahun Ini',
    
    // Authentication
    signIn: 'Masuk',
    signOut: 'Keluar',
    signUp: 'Daftar',
    password: 'Kata Sandi',
    confirmPassword: 'Konfirmasi Kata Sandi',
    forgotPassword: 'Lupa Kata Sandi',
    resetPassword: 'Reset Kata Sandi',
    
    // Tasks
    task: 'Tugas',
    title: 'Judul',
    assignee: 'Penerima Tugas',
    dueDate: 'Tanggal Jatuh Tempo',
    priority: 'Prioritas',
    high: 'Tinggi',
    medium: 'Sedang',
    low: 'Rendah',
    completed: 'Selesai',
    inProgress: 'Dalam Proses',
    notStarted: 'Belum Dimulai',
    
    // Notifications
    requestApproved: 'Permintaan berhasil disetujui',
    requestRejected: 'Permintaan berhasil ditolak',
    requestSubmitted: 'Permintaan berhasil dikirim',
    requestUpdated: 'Permintaan berhasil diperbarui',
    requestDeleted: 'Permohonan berhasil dihapus',
    changesSaved: 'Perubahan berhasil disimpan',
    uploadSuccess: 'Unggah berhasil',
    
    // Errors
    invalidInput: 'Input tidak valid',
    networkError: 'Error jaringan',
    serverError: 'Error server',
    accessDenied: 'Akses ditolak',
    
    // Form Validation
    requiredField: 'Field ini wajib diisi',
    invalidDate: 'Tanggal tidak valid',
    invalidAmount: 'Jumlah tidak valid',
    selectOption: 'Pilih opsi',
    
    // File Upload (Indonesian)
    dragDropFiles: 'Seret dan lepas file di sini, atau klik untuk memilih',
    supportedFormats: 'Format yang didukung',
    maxFileSize: 'Ukuran file maksimum',
    uploading: 'Mengunggah...',
    uploadComplete: 'Unggah selesai',
    uploadFailed: 'Unggah gagal',
    
    // Extended Profile Fields (Indonesian)
    idNumber: 'Nomor ID',
    passportNumber: 'Nomor Paspor',
    visaNumber: 'Nomor Visa', 
    dateOfBirth: 'Tanggal Lahir',
    homeAddress: 'Alamat Rumah',
    maritalStatus: 'Status Perkawinan',
    emergencyContactName: 'Nama Kontak Darurat',
    emergencyContactPhone: 'Telepon Kontak Darurat',
    phoneNumber: 'Nomor Telepon',
    single: 'Lajang',
    married: 'Menikah',
    divorced: 'Cerai',
    widowed: 'Janda/Duda',
    
    // Document Management - New unique keys only (Indonesian)
    documents: 'Dokumen',
    uploadDocument: 'Unggah Dokumen',
    documentType: 'Jenis Dokumen',
    selectDocumentType: 'Pilih Jenis Dokumen',
    passport: 'Paspor',
    idCard: 'KTP',
    visa: 'Visa',
    certificate: 'Sertifikat',
    contract: 'Kontrak',
    viewDocument: 'Lihat Dokumen',
    deleteDocument: 'Hapus Dokumen',
    documentUploaded: 'Dokumen berhasil diunggah',
    documentDeleted: 'Dokumen berhasil dihapus',
    noDocuments: 'Belum ada dokumen',
    
    // Calendar Interactions - New unique keys only (Indonesian)
    createLeaveRequest: 'Buat Permohonan Cuti',
    clickToCreateLeave: 'Klik tanggal untuk membuat permohonan cuti',
    editLeaveRequest: 'Edit Permohonan Cuti',
    deleteLeaveRequest: 'Hapus Permohonan Cuti',
    confirmDeleteLeave: 'Yakin ingin menghapus permohonan cuti ini?',
    cannotEditApproved: 'Tidak dapat mengedit permohonan yang sudah disetujui',
    leaveUpdated: 'Permohonan cuti berhasil diupdate',
    leaveDeleted: 'Permohonan cuti berhasil dihapus',
    
    // Cash Control Dual Role - New unique keys only (Indonesian)
    personalView: 'Tampilan Pribadi',
    managementView: 'Tampilan Manajemen',
    selectEmployee: 'Pilih Karyawan',
    allEmployees: 'Semua Karyawan',
    teamTransactions: 'Transaksi Tim',
    bulkApprove: 'Setujui Semua',
    filterByStatus: 'Filter by Status',
    filterByEmployee: 'Filter by Karyawan',
    approvalWorkflow: 'Alur Persetujuan'
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