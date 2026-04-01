import React, { useState, useEffect } from 'react';
import { X, Users, Trash2, Mail, User, AlertCircle, UserRoundPlus} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const GroupMembersModal = ({ isOpen, onClose, groupId, currentUserId, currentUserRole, onMembersUpdated }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Стани для запрошення
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState(null);
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [inviteMessage, setInviteMessage] = useState({ text: '', type: '' });

  const MAX_MEMBERS = 15;

  useEffect(() => {
    if (isOpen && groupId) {
      loadMembers();
      setMessage({ text: '', type: '' });
      setInviteMessage({ text: '', type: '' });
      setInviteEmail('');
    }
  }, [isOpen, groupId]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const showInviteMessage = (text, type = 'success') => {
    setInviteMessage({ text, type });
    setTimeout(() => setInviteMessage({ text: '', type: '' }), 5000);
  };

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
      showMessage('Не вдалося завантажити учасників', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/groups/${groupId}/members/${targetUserId}/role`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        showMessage('Роль успішно змінено');
        loadMembers(); 
      } else {
        const errorData = await res.json();
        showMessage(errorData.error || 'Помилка зміни ролі', 'error');
      }
    } catch (err) {
      showMessage('Помилка сервера', 'error');
    }
  };

  const executeRemoveMember = async () => {
  if (!memberToRemove) return;

  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/groups/${groupId}/members/${memberToRemove.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (res.ok) {
    showMessage(`Учасника ${memberToRemove.name} видалено`);
    loadMembers();
    if (onMembersUpdated) onMembersUpdated();
  } else {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Помилка видалення'); 
  }
};

  const handleInvite = async (e) => {
    e.preventDefault();
    const emailToInvite = inviteEmail.trim();
    if (!emailToInvite) return;

    // Перевірка введеної пошти
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToInvite)) {
      showInviteMessage('Невірний формат пошти. Введіть коректний email (наприклад: name@gmail.com)', 'error');
      return;
    }

    setIsInviting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/groups/${groupId}/members/invite`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailToInvite, role: inviteRole })
      });
      
      const data = await res.json();

      if (res.ok) {
        showInviteMessage(`Запрошення успішно надіслано на ${emailToInvite}`);
        setInviteEmail('');
      } else {
        showInviteMessage(data.error || 'Не вдалося надіслати запрошення', 'error');
      }
    } catch (err) {
      showInviteMessage('Помилка сервера', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const getRoleDisplayName = (role) => {
    if (role === 'admin') return 'Власник';
    if (role === 'member') return 'Учасник';
    if (role === 'reader') return 'Читач';
    return role;
  };

  const isAdmin = currentUserRole === 'admin';
  const isLimitReached = members.length >= MAX_MEMBERS;

  // Сортування списку: Поточний користувач -> Власник -> Інші
  const sortedMembers = [...members].sort((a, b) => {
    const isMeA = String(a.id) === String(currentUserId);
    const isMeB = String(b.id) === String(currentUserId);
    
    if (isMeA) return -1;
    if (isMeB) return 1;
    
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    
    return 0;
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content members-modal" onClick={(e) => e.stopPropagation()}>
        
        <button className="btn-close-modal" onClick={onClose}><X size={24} /></button>
        
        <div className="modal-header-centered">
          <h2 className="modal-title">
            <Users size={28} color="var(--accent-silver)" />
            Учасники групи
          </h2>
          <div className={`members-count-badge ${isLimitReached ? 'limit-reached' : ''}`}>
            {members.length} / {MAX_MEMBERS}
          </div>
        </div>

        <div className="msg-placeholder">
          {message.text && (
            <div className={`general-error ${message.type === 'success' ? 'success-text' : ''}`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="members-list-container">
          {isLoading ? (
            <div className="loading-text">Завантаження...</div>
          ) : (
            sortedMembers.map(member => {
              const isMe = String(member.id) === String(currentUserId);
              
              return (
                <div key={member.id} className={`member-item ${isMe ? 'is-me' : ''}`}>
                  <div className="member-info">
                    {member.avatar ? (
                      <img src={member.avatar} alt="Аватар" className="member-avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        <User size={20} color="var(--text-muted)" />
                      </div>
                    )}
                    <div>
                      <span className="member-name">{member.name}</span>
                      {(isAdmin) && member.email && (
                        <span className="member-email" style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--text-muted)', 
                          opacity: 0.7,
                          marginTop: '0.1rem',
                          marginLeft: '0.5rem'
                        }}>
                          [ {member.email} ]
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="member-actions">
                    {member.role === 'admin' ? (
                      <span className={`role-badge ${isMe ? 'me' : ''}`}> Власник</span>
                    ) : isAdmin ? (
                      <>
                        <select 
                          className="role-select" 
                          value={member.role} 
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        >
                          <option value="member">Учасник</option>
                          <option value="reader">Читач</option>
                        </select>
                        <button 
                          className="btn-icon danger" 
                          title="Видалити учасника"
                          onClick={() => setMemberToRemove(member)}>
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <span className={`role-badge ${isMe ? 'me' : ''}`}> {getRoleDisplayName(member.role)}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {isAdmin && (
          <>
            <hr className="members-divider" />
            <div className="invite-section">
              <h3 className="invite-title">
                <UserRoundPlus size={20} color="var(--accent-silver)" />
                Запросити нових учасників
              </h3>
              
              <div className="msg-placeholder">
                {inviteMessage.text && (
                  <div className={`general-error ${inviteMessage.type === 'success' ? 'success-text' : ''}`}>
                    {inviteMessage.text}
                  </div>
                )}
              </div>

              {isLimitReached ? (
                <div className="limit-alert">
                  <AlertCircle size={24} className="limit-icon" />
                  <span>
                    У цій групі вже досягнуто ліміт у <b>{MAX_MEMBERS} учасників</b>. Ви не можете відправляти нові запрошення, поки не видалите когось зі списку.
                  </span>
                </div>
              ) : (
                <form className="invite-form-vertical" onSubmit={handleInvite} noValidate>
                  <div className="invite-inputs-row">
                    <div className="invite-input-wrapper">
                      <Mail size={18} className="invite-icon" />
                      <input 
                        type="email" 
                        placeholder="Введіть email для запрошення" 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        disabled={isInviting}
                      />
                    </div>
                    <select 
                      className="role-select" 
                      value={inviteRole} 
                      onChange={(e) => setInviteRole(e.target.value)}
                      disabled={isInviting}
                    >
                      <option value="member">Учасник</option>
                      <option value="reader">Читач</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-modal-action btn-full-width" disabled={!inviteEmail.trim() || isInviting}>
                    {isInviting ? 'Відправка...' : 'Відправити запрошення'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        <ConfirmModal 
          isOpen={!!memberToRemove}
          onClose={() => setMemberToRemove(null)}
          onConfirm={executeRemoveMember}
          title="Видалити учасника?"
          description={`Ви впевнені, що хочете видалити учасника "${memberToRemove?.name}" з цієї групи?`}
        />
      </div>
    </div>
  );
};

export default GroupMembersModal;