import React, { useState, useEffect } from 'react';
import { 
  MoreVertical, Edit, Users, Star, Trash2, LogOut, 
  Image as ImageIcon, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GroupHeader = ({ 
  groupData, 
  onEdit, 
  onMembers, 
  onDelete, 
  onLeave, 
  onToggleFavorite 
}) => {
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'uk' ? 'uk-UA' : 'en-US';

  useEffect(() => {
    const handleClickOutside = () => setShowGroupMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!groupData) return null;

  const topMember = groupData.topMember;

  return (
    <div className="glass-panel group-header-card">
      <div className="group-header-top">
        {groupData.coverUrl ? (
          <img src={groupData.coverUrl} alt={t('groups.header.cover_alt')} className="group-cover-large" />
        ) : (
          <div className="group-cover-large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass-bg)' }}>
            <ImageIcon size={50} opacity={0.5} />
          </div>
        )}

        {/* Основна інформація та базова статистика */}
        <div className="group-info-main">
          <h1 className="group-header-name">{groupData.name}</h1>
          <span className="group-header-date">
            {t('groups.header.created_at', { 
              date: new Date(groupData.createdAt).toLocaleDateString(dateLocale) 
            })}
          </span>
          
          <div className="group-basic-stats">
            <span>{t('groups.header.stats_members')} <strong>{groupData.membersCount}</strong></span>
            <span>{t('groups.header.stats_posts')} <strong>{groupData.postsCount}</strong></span>
            <span>{t('groups.header.stats_images')} <strong>{groupData.imagesCount}</strong></span>
          </div>
        </div>

        <div style={{ position: 'relative', alignSelf: 'flex-start'}}>
          <button className="btn-options" onClick={(e) => { e.stopPropagation(); setShowGroupMenu(!showGroupMenu); }}>
            <MoreVertical size={24} />
          </button>
          
          {showGroupMenu && (
            <div className="dropdown-menu">
              {groupData.userRole === 'admin' ? (
                <>
                  <button className="dropdown-item" onClick={onEdit}><Edit size={18} /> {t('groups.header.menu_edit')}</button>
                  <button className="dropdown-item" onClick={onMembers}><Users size={18} /> {t('groups.header.menu_members')}</button>
                  <button className="dropdown-item" onClick={onToggleFavorite}>
                    <Star size={18} fill={groupData.isFavorite ? "#E2E8F0" : "transparent"} color={groupData.isFavorite ? "#E2E8F0" : "currentColor"} /> 
                    {groupData.isFavorite ? t('groups.header.menu_remove_favorite') : t('groups.header.menu_add_favorite')}
                  </button>
                  <button className="dropdown-item danger" onClick={onDelete}><Trash2 size={18} /> {t('groups.header.menu_delete')}</button>
                </>
              ) : (
                <>
                  <button className="dropdown-item" onClick={onToggleFavorite}>
                    <Star size={18} fill={groupData.isFavorite ? "#E2E8F0" : "transparent"} color={groupData.isFavorite ? "#E2E8F0" : "currentColor"} /> 
                    {groupData.isFavorite ? t('groups.header.menu_remove_favorite') : t('groups.header.menu_add_favorite')}
                  </button>
                  <button className="dropdown-item" onClick={onMembers}><Users size={18} /> {t('groups.header.menu_view_members')}</button>
                  <button className="dropdown-item danger" onClick={onLeave}>
                    <LogOut size={18} /> {t('groups.header.menu_leave')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`group-expanded-section ${isExpanded ? 'open' : ''}`}>
        <div className="group-expanded-content">
          
          <p className="group-description-text" style={{ opacity: groupData.description ? 0.9 : 0.7 }}>
            {groupData.description || t('groups.header.no_description')}
          </p>

          {topMember && (
            <>
              <div className="fancy-divider">
                <Sparkles size={28} color="var(--accent-silver)" />
              </div>
              
              <div className="group-extra-stats">
                <span>
                  {t('groups.header.top_member')} <strong style={{ color: 'var(--text-main)' }}>{topMember.name}</strong>.
                  {' '}{t('groups.header.top_member_created')} <strong style={{ color: 'var(--text-main)' }}>{topMember.post_count}</strong> {t('groups.header.top_member_posts')}
                </span>
              </div>
            </>
          )}

        </div>
      </div>

      <button 
        className="btn-expand-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? t('groups.header.collapse') : t('groups.header.expand')}
      >
        {isExpanded ? <ChevronUp size={25} /> : <ChevronDown size={25} />}
      </button>

    </div>
  );
};

export default GroupHeader;