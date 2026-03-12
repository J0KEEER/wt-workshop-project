import { render, screen, fireEvent } from '@testing-library/react';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../Modal';

describe('Modal Components', () => {
    describe('ModalOverlay', () => {
        it('renders children when isOpen is true', () => {
            render(
                <ModalOverlay isOpen={true} onClose={() => {}}>
                    <div data-testid="child">Modal Content</div>
                </ModalOverlay>
            );
            expect(screen.getByTestId('child')).toBeInTheDocument();
            expect(screen.getByText('Modal Content')).toBeInTheDocument();
        });

        it('does not render when isOpen is false', () => {
            render(
                <ModalOverlay isOpen={false} onClose={() => {}}>
                    <div data-testid="child">Modal Content</div>
                </ModalOverlay>
            );
            expect(screen.queryByTestId('child')).not.toBeInTheDocument();
        });

        it('calls onClose when clicking the overlay backdrop', () => {
            const handleClose = jest.fn();
            render(
                <ModalOverlay isOpen={true} onClose={handleClose}>
                    <div data-testid="child">Content</div>
                </ModalOverlay>
            );
            
            // The overlay is the element with 'modal-overlay' class
            // RTL doesn't officially support querying by class easily by default, 
            // but we know it wraps the content
            const overlay = screen.getByTestId('child').parentElement.parentElement;
            
            fireEvent.click(overlay);
            expect(handleClose).toHaveBeenCalledTimes(1);
        });

        it('does not call onClose when clicking the modal content itself', () => {
            const handleClose = jest.fn();
            render(
                <ModalOverlay isOpen={true} onClose={handleClose}>
                    <div data-testid="child">Content</div>
                </ModalOverlay>
            );
            
            const content = screen.getByTestId('child').parentElement;
            fireEvent.click(content);
            expect(handleClose).not.toHaveBeenCalled();
        });
    });

    describe('ModalHeader', () => {
        it('renders the title', () => {
            render(<ModalHeader title="Test Title" onClose={() => {}} />);
            expect(screen.getByText('Test Title')).toBeInTheDocument();
        });

        it('calls onClose when the close button is clicked', () => {
            const handleClose = jest.fn();
            render(<ModalHeader title="Title" onClose={handleClose} />);
            
            const closeButton = screen.getByRole('button');
            fireEvent.click(closeButton);
            
            expect(handleClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('ModalBody', () => {
        it('renders arbitrary children with modal-body class', () => {
            const { container } = render(
                <ModalBody>
                    <p>Body Content</p>
                </ModalBody>
            );
            expect(screen.getByText('Body Content')).toBeInTheDocument();
            expect(container.firstChild).toHaveClass('modal-body');
        });
    });

    describe('ModalFooter', () => {
        it('renders arbitrary children with modal-footer class', () => {
            const { container } = render(
                <ModalFooter>
                    <button>Save</button>
                </ModalFooter>
            );
            expect(screen.getByText('Save')).toBeInTheDocument();
            expect(container.firstChild).toHaveClass('modal-footer');
        });
    });
});
