import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '1.2rem',
    borderRadius = 'var(--radius-sm)',
    className = ''
}) => {
    return (
        <div
            className={`${styles.skeleton} ${className}`}
            style={{ width, height, borderRadius }}
        />
    );
};
