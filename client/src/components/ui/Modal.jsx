import { X } from 'lucide-react';
import React from 'react';

/**
 * Reusable, composable Modal component to prevent boilerplate across pages.
 * Enforces the `vercel-composition-patterns` by accepting `children` instead of many boolean props.
 */
export function ModalOverlay({ isOpen, onClose, children }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

export function ModalHeader({ title, onClose, icon: Icon }) {
    return (
        <div className="modal-header">
            <h3 style={Icon ? { display: 'flex', alignItems: 'center', gap: '8px' } : {}}>
                {Icon && <Icon size={20} />}
                {title}
            </h3>
            <button type="button" className="modal-close" onClick={onClose}>
                <X size={18} />
            </button>
        </div>
    );
}

export function ModalBody({ children }) {
    return (
        <div className="modal-body">
            {children}
        </div>
    );
}

export function ModalFooter({ children }) {
    return (
        <div className="modal-footer">
            {children}
        </div>
    );
}
