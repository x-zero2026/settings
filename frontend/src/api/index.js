import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_DID_LOGIN_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = 'https://main.d2fozf421c6ftf.amplifyapp.com';
    }
    return Promise.reject(error);
  }
);

// ============================================
// User APIs
// ============================================

export const getProfile = () => {
  return api.get('/api/user/profile');
};

export const updateProfile = (data) => {
  return api.patch('/api/user/profile', data);
};

export const searchUsers = (query) => {
  return api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
};

// ============================================
// Project APIs
// ============================================

export const listProjects = () => {
  return api.get('/api/projects');
};

export const getProject = (projectId) => {
  return api.get(`/api/projects/${projectId}`);
};

export const updateProject = (projectId, data) => {
  return api.patch(`/api/projects/${projectId}`, data);
};

export const addProjectMember = (projectId, data) => {
  return api.post(`/api/projects/${projectId}/members`, data);
};

export const removeProjectMember = (projectId, userDid) => {
  return api.delete(`/api/projects/${projectId}/members/${userDid}`);
};

export const updateProjectMemberRole = (projectId, userDid, data) => {
  return api.patch(`/api/projects/${projectId}/members/${userDid}`, data);
};

// ============================================
// Constants
// ============================================

export const PROFESSION_TAGS = {
  // 技术类
  'frontend-developer': '前端开发',
  'backend-developer': '后端开发',
  'fullstack-developer': '全栈开发',
  'mobile-developer': '移动开发',
  'devops-engineer': 'DevOps 工程师',
  'data-engineer': '数据工程师',
  'ml-engineer': '机器学习工程师',
  'qa-engineer': '测试工程师',
  
  // 设计类
  'ui-designer': 'UI 设计师',
  'ux-designer': 'UX 设计师',
  'product-designer': '产品设计师',
  'graphic-designer': '平面设计师',
  
  // 产品/管理类
  'product-manager': '产品经理',
  'project-manager': '项目经理',
  'scrum-master': '敏捷教练',
  
  // 商业类
  'business-analyst': '商业分析师',
  'entrepreneur': '创业者',
  'consultant': '咨询顾问',
  
  // 其他
  'researcher': '研究员',
  'writer': '写作者',
  'marketer': '市场营销',
};

export const PROFESSION_TAG_CATEGORIES = {
  '技术': [
    'frontend-developer',
    'backend-developer',
    'fullstack-developer',
    'mobile-developer',
    'devops-engineer',
    'data-engineer',
    'ml-engineer',
    'qa-engineer',
  ],
  '设计': [
    'ui-designer',
    'ux-designer',
    'product-designer',
    'graphic-designer',
  ],
  '产品/管理': [
    'product-manager',
    'project-manager',
    'scrum-master',
  ],
  '商业': [
    'business-analyst',
    'entrepreneur',
    'consultant',
  ],
  '其他': [
    'researcher',
    'writer',
    'marketer',
  ],
};

export default api;
