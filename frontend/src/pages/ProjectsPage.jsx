import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  listProjects,
  getProject,
  updateProject,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  searchUsers,
} from '../api';
import { getUserInfo } from '../utils/auth';
import './ProjectsPage.css';

function ProjectsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = getUserInfo();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Project name editing
  const [editingName, setEditingName] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Member management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      loadProjectDetails(projectId);
    }
  }, [projectId, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listProjects();
      const projectList = response.data.data || response.data || [];
      setProjects(projectList);
    } catch (err) {
      setError(err.response?.data?.error || '加载项目列表失败');
      console.error('Load projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (id) => {
    try {
      setError(null);
      const response = await getProject(id);
      const projectData = response.data.data || response.data;
      setSelectedProject(projectData);
      setNewProjectName(projectData.project_name);
    } catch (err) {
      setError(err.response?.data?.error || '加载项目详情失败');
      console.error('Load project details error:', err);
    }
  };

  const handleProjectClick = (project) => {
    navigate(`/projects/${project.project_id}`);
  };

  const handleBackToList = () => {
    navigate('/projects');
    setSelectedProject(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSaveProjectName = async () => {
    if (!newProjectName.trim()) {
      setError('项目名称不能为空');
      return;
    }

    try {
      setSavingName(true);
      setError(null);
      await updateProject(selectedProject.project_id, {
        project_name: newProjectName,
      });
      setSuccess('项目名称已更新');
      setEditingName(false);
      await loadProjects();
      await loadProjectDetails(selectedProject.project_id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '更新项目名称失败');
    } finally {
      setSavingName(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setError(null);
      const response = await searchUsers(searchQuery);
      const users = response.data.data || response.data || [];
      setSearchResults(users);
    } catch (err) {
      setError(err.response?.data?.error || '搜索用户失败');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userDid, role = 'member') => {
    try {
      setAddingMember(true);
      setError(null);
      await addProjectMember(selectedProject.project_id, {
        user_did: userDid,
        role,
      });
      setSuccess('成员已添加');
      setSearchQuery('');
      setSearchResults([]);
      await loadProjectDetails(selectedProject.project_id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '添加成员失败');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userDid) => {
    if (!confirm('确定要删除此成员吗？')) return;

    try {
      setError(null);
      await removeProjectMember(selectedProject.project_id, userDid);
      setSuccess('成员已删除');
      await loadProjectDetails(selectedProject.project_id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '删除成员失败');
    }
  };

  const handleChangeRole = async (userDid, newRole) => {
    try {
      setError(null);
      await updateProjectMemberRole(selectedProject.project_id, userDid, {
        role: newRole,
      });
      setSuccess('角色已更新');
      await loadProjectDetails(selectedProject.project_id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '更新角色失败');
    }
  };

  const isCreator = (project) => {
    return project.creator_did === currentUser?.did;
  };

  const isAdmin = (project) => {
    // For project list, use project.role
    // For project detail, use project.user_role
    return project.role === 'admin' || project.user_role === 'admin';
  };

  const isMemberOfProject = (userDid) => {
    return selectedProject?.members?.some(m => m.did === userDid);
  };

  if (loading) {
    return (
      <div className="projects-page">
        <div className="projects-container">
          <div className="loading">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  // Project list view
  if (!projectId) {
    return (
      <div className="projects-page">
        <div className="projects-container">
          <h1 className="page-title">我的项目</h1>

          {error && <div className="error-message">{error}</div>}

          {projects.length === 0 ? (
            <div className="empty-state">
              <p>暂无项目</p>
            </div>
          ) : (
            <div className="projects-list">
              {projects.map((project) => (
                <div
                  key={project.project_id}
                  className="project-card"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="project-name">{project.project_name}</div>
                  <div className="project-meta">
                    <span className={`role-badge role-${project.role}`}>
                      {project.role === 'admin' ? '管理员' : '成员'}
                    </span>
                    {isCreator(project) && (
                      <span className="creator-badge">创建者</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Project detail view
  if (!selectedProject) {
    return (
      <div className="projects-page">
        <div className="projects-container">
          <div className="loading">
            <div className="spinner"></div>
            <p>加载项目详情...</p>
          </div>
        </div>
      </div>
    );
  }

  const canManage = isAdmin(selectedProject);
  const isProjectCreator = isCreator(selectedProject);

  return (
    <div className="projects-page">
      <div className="projects-container">
        <button className="back-button" onClick={handleBackToList}>
          ← 返回项目列表
        </button>

        <div className="project-detail">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Project name */}
          <div className="project-header">
            {editingName ? (
              <div className="edit-name-form">
                <input
                  type="text"
                  className="form-input"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  disabled={savingName}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveProjectName}
                  disabled={savingName}
                >
                  {savingName ? '保存中...' : '保存'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setEditingName(false);
                    setNewProjectName(selectedProject.project_name);
                  }}
                  disabled={savingName}
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="project-name-display">
                <h1 className="page-title">{selectedProject.project_name}</h1>
                {canManage && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingName(true)}
                  >
                    编辑名称
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members section */}
          <div className="members-section">
            <h2 className="section-title">成员管理</h2>

            {canManage && (
              <div className="add-member-form">
                <div className="search-box">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="搜索用户（用户名或邮箱）"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSearchUsers}
                    disabled={searching || !searchQuery.trim()}
                  >
                    {searching ? '搜索中...' : '搜索'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((user) => (
                      <div key={user.did} className="search-result-item">
                        <div className="user-info">
                          <div className="user-name">{user.username}</div>
                          <div className="user-email">{user.email}</div>
                          {user.profession_tags && user.profession_tags.length > 0 && (
                            <div className="user-tags">
                              {user.profession_tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="tag">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isMemberOfProject(user.did) ? (
                          <span className="already-member">已是成员</span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAddMember(user.did)}
                            disabled={addingMember}
                          >
                            添加
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members list */}
            <div className="members-list">
              {selectedProject.members && selectedProject.members.length > 0 ? (
                selectedProject.members.map((member) => {
                  const isMemberCreator = member.did === selectedProject.creator_did;
                  const canModify = canManage && !isMemberCreator;

                  return (
                    <div key={member.did} className="member-item">
                      <div className="member-info">
                        <div className="member-name">{member.username}</div>
                        <div className="member-meta">
                          <span className={`role-badge role-${member.role}`}>
                            {member.role === 'admin' ? '管理员' : '成员'}
                          </span>
                          {isMemberCreator && (
                            <span className="creator-badge">创建者</span>
                          )}
                        </div>
                      </div>
                      {canModify && (
                        <div className="member-actions">
                          {member.role === 'admin' ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleChangeRole(member.did, 'member')}
                            >
                              改为成员
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleChangeRole(member.did, 'admin')}
                            >
                              改为管理员
                            </button>
                          )}
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveMember(member.did)}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">暂无成员</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectsPage;
