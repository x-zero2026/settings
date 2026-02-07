import { useState, useEffect } from 'react';
import { getProfile, updateProfile, PROFESSION_TAGS, PROFESSION_TAG_CATEGORIES } from '../api';
import './ProfilePage.css';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: '',
    profession_tags: [],
  });
  
  const [customTag, setCustomTag] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProfile();
      const userData = response.data.data || response.data;
      setProfile(userData);
      setFormData({
        bio: userData.bio || '',
        profession_tags: userData.profession_tags || [],
      });
    } catch (err) {
      setError(err.response?.data?.error || '加载个人资料失败');
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBioChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setFormData({ ...formData, bio: value });
    }
  };

  const handleTagToggle = (tag) => {
    const currentTags = formData.profession_tags;
    if (currentTags.includes(tag)) {
      // Remove tag
      setFormData({
        ...formData,
        profession_tags: currentTags.filter(t => t !== tag),
      });
    } else {
      // Add tag (max 5)
      if (currentTags.length < 5) {
        setFormData({
          ...formData,
          profession_tags: [...currentTags, tag],
        });
      }
    }
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    const trimmedTag = customTag.trim();
    
    if (!trimmedTag) {
      return;
    }
    
    // Check if already exists
    if (formData.profession_tags.includes(trimmedTag)) {
      setError('该标签已存在');
      setTimeout(() => setError(null), 2000);
      return;
    }
    
    // Check max limit
    if (formData.profession_tags.length >= 5) {
      setError('最多只能添加 5 个标签');
      setTimeout(() => setError(null), 2000);
      return;
    }
    
    // Check tag length
    if (trimmedTag.length > 50) {
      setError('标签长度不能超过 50 个字符');
      setTimeout(() => setError(null), 2000);
      return;
    }
    
    // Add custom tag
    setFormData({
      ...formData,
      profession_tags: [...formData.profession_tags, trimmedTag],
    });
    setCustomTag('');
  };

  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      profession_tags: formData.profession_tags.filter(t => t !== tag),
    });
  };

  const isPreDefinedTag = (tag) => {
    return Object.keys(PROFESSION_TAGS).includes(tag);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await updateProfile(formData);
      
      setSuccess(true);
      // Reload profile
      await loadProfile();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '保存失败');
      console.error('Update profile error:', err);
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error">无法加载个人资料</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="page-title">个人资料</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">保存成功！</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Read-only fields */}
          <div className="form-section">
            <h2 className="section-title">基本信息</h2>
            
            <div className="form-group">
              <label className="form-label">用户名</label>
              <input
                type="text"
                className="form-input"
                value={profile.username}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">邮箱</label>
              <input
                type="email"
                className="form-input"
                value={profile.email}
                disabled
              />
            </div>
          </div>

          {/* Personal bio */}
          <div className="form-section">
            <h2 className="section-title">个人简介</h2>
            <p className="section-description">
              最多 500 字符 ({formData.bio.length}/500)
            </p>
            <textarea
              className="form-textarea"
              value={formData.bio}
              onChange={handleBioChange}
              placeholder="介绍一下你自己..."
              rows={6}
            />
          </div>

          {/* Profession tags */}
          <div className="form-section">
            <h2 className="section-title">职业标签</h2>
            <p className="section-description">
              选择或添加最多 5 个标签 ({formData.profession_tags.length}/5)
            </p>

            {/* Selected tags display */}
            {formData.profession_tags.length > 0 && (
              <div className="selected-tags">
                <h3 className="category-title">已选标签</h3>
                <div className="tag-list">
                  {formData.profession_tags.map((tag) => (
                    <div key={tag} className={`selected-tag ${isPreDefinedTag(tag) ? 'predefined' : 'custom'}`}>
                      <span className="tag-text">
                        {isPreDefinedTag(tag) ? PROFESSION_TAGS[tag] : tag}
                      </span>
                      <button
                        type="button"
                        className="remove-tag-btn"
                        onClick={() => handleRemoveTag(tag)}
                        title="移除标签"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add custom tag */}
            <div className="custom-tag-section">
              <h3 className="category-title">添加自定义标签</h3>
              <div className="custom-tag-input-group">
                <input
                  type="text"
                  className="form-input custom-tag-input"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustomTag(e);
                    }
                  }}
                  placeholder="输入自定义标签，如：客服专员、运营经理..."
                  maxLength={50}
                  disabled={formData.profession_tags.length >= 5}
                />
                <button
                  type="button"
                  className="btn btn-secondary add-tag-btn"
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim() || formData.profession_tags.length >= 5}
                >
                  添加
                </button>
              </div>
              <p className="help-text">
                💡 提示：可以添加任何职业标签，如客服、运营、销售等
              </p>
            </div>

            {/* Predefined tags */}
            <div className="predefined-tags-section">
              <h3 className="category-title">预定义标签（点击快速添加）</h3>
              {Object.entries(PROFESSION_TAG_CATEGORIES).map(([category, tags]) => (
                <div key={category} className="tag-category">
                  <h4 className="category-subtitle">{category}</h4>
                  <div className="tag-list">
                    {tags.map((tag) => (
                      <label key={tag} className="tag-item">
                        <input
                          type="checkbox"
                          checked={formData.profession_tags.includes(tag)}
                          onChange={() => handleTagToggle(tag)}
                          disabled={
                            !formData.profession_tags.includes(tag) &&
                            formData.profession_tags.length >= 5
                          }
                        />
                        <span className="tag-label">{PROFESSION_TAGS[tag]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
