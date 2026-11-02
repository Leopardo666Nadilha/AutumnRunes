import React from 'react';
import { Construction } from 'lucide-react';
import styles from './ConstructionNotice.module.css';

interface ConstructionNoticeProps {
    title: string;
    text: string;
}

export const ConstructionNotice: React.FC<ConstructionNoticeProps> = ({ title, text }) => (
    <div className={styles.notice} role="note">
        <div className={styles.icon}>
            <Construction size={20} />
        </div>
        <div className={styles.body}>
            <span className={styles.title}>{title}</span>
            <span className={styles.text}>{text}</span>
        </div>
    </div>
);
