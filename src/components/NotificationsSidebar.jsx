import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export default function NotificationsSidebar({ isOpen, onToggle, teamId }) {
  if (teamId === 'skip') {
    return (
      <>
        <button
          onClick={onToggle}
          style={{
            position: 'fixed',
            right: isOpen ? '350px' : '0',
            top: '30%',
            transform: 'translateY(-50%)',
            background: 'linear-gradient(135deg, #0ff, #00a8a8)',
            border: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '20px 12px',
            cursor: 'pointer',
            zIndex: 1001,
            color: '#000',
            fontWeight: 'bold',
            fontSize: '18px',
            boxShadow: '-4px 0 20px rgba(0, 255, 255, 0.3)',
            transition: 'right 0.3s ease',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
        >
          {isOpen ? '→' : '←'} NOTIFICATIONS
        </button>

        <div
        style={{
          position: 'fixed',
          right: isOpen ? '0' : '-350px',
          top: '0',
          width: '350px',
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 60, 0.95))',
          borderLeft: '2px solid #0ff',
          boxShadow: '-4px 0 20px rgba(0, 255, 255, 0.1)',
          transition: 'right 0.3s ease',
          zIndex: 1000,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px'
        }}
      >
        <h2 style={{
          color: '#0ff',
          marginBottom: '16px',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
          fontSize: '24px',
          borderBottom: '2px solid #0ff',
          paddingBottom: '10px'
        }}>
          💬 NOTIFICATIONS
        </h2>

        <p style={{ color: 'grey', textAlign: 'center' }}>You must join a team to receive notifications</p>
      </div>
      </>
    )
  }
    
  let notifications;
  try {
    notifications = useQuery(api.game.getNotifications, { teamId });
  } catch (error) {
    console.log(error);
  }
  const styles = {
    invest: { 
      backgroundColor: 'lightblue',
      border: '1px solid blue'
    },
    attack: {
      backgroundColor: 'rgba(255, 101, 101, 1)',
      border: '1px solid red'
    },
    defend: {
      backgroundColor: 'lightgreen',
      border: '1px solid green'
    }
  }

  let notificationList;

  if (notifications) {
    notificationList = notifications.map((notification) => {
      let message = 'Your team';
      
      if (notification.actionType === 'invest') {
        message += ` has invested ${ notification.cost } coins!`;
      } else if (notification.actionType === 'attack') {
        if (teamId === notification.targetTeamId) {
          message += ` has been attacked by ${ notification.targetTeamName }! Your team is now frozen until ${ notification.cooldownUntil } :(`;
        } else {
          message += ` has attacked ${ notification.targetTeamName }! Their team is now frozen until ${ notification.cooldownUntil }! ;)`;
        }
      } else {
        if (teamId === notification.targetTeamId) {
          message += ` was attacked by ${ notification.teamName }! But your team defended it!`;
        } else {
          message += ` attacked ${ notification.teamName }! But they defended it >:(`;
        }
      }

      return (
        <div 
          className="notification"
          style={{...styles[notification.actionType], color: 'black', padding: 10, marginBottom: 10}}
        >
          <p>{ message }</p>
        </div>
      )
    })
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? '350px' : '0',
          top: '30%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(135deg, #0ff, #00a8a8)',
          border: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '20px 12px',
          cursor: 'pointer',
          zIndex: 1001,
          color: '#000',
          fontWeight: 'bold',
          fontSize: '18px',
          boxShadow: '-4px 0 20px rgba(0, 255, 255, 0.3)',
          transition: 'right 0.3s ease',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
      >
        {isOpen ? '→' : '←'} NOTIFICATIONS
      </button>

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          right: isOpen ? '0' : '-350px',
          top: '0',
          width: '350px',
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 60, 0.95))',
          borderLeft: '2px solid #0ff',
          boxShadow: '-4px 0 20px rgba(0, 255, 255, 0.1)',
          transition: 'right 0.3s ease',
          zIndex: 1000,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px'
        }}
      >
        <h2 style={{
          color: '#0ff',
          marginBottom: '16px',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
          fontSize: '24px',
          borderBottom: '2px solid #0ff',
          paddingBottom: '10px'
        }}>
          💬 NOTIFICATIONS
        </h2>

        { notificationList }
      </div>
    </>
  );
}
