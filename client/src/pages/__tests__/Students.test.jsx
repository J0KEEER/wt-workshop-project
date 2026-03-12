import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Students from '../Students';
import api from '../../services/api';

// Mock the API service completely
jest.mock('../../services/api');

// Mock Lucide icons that are used in Students.jsx
jest.mock('lucide-react', () => ({
    Plus: () => <div data-testid="icon-plus">Plus</div>,
    Edit2: () => <div data-testid="icon-edit">Edit</div>,
    Trash2: () => <div data-testid="icon-trash">Trash</div>,
    Search: () => <div data-testid="icon-search">Search</div>,
    X: () => <div data-testid="icon-x">X</div>,
    AlertTriangle: () => <div data-testid="icon-alert">Alert</div>,
    BookOpen: () => <div data-testid="icon-bookopen">BookOpen</div>,
}));

describe('Students Page - Integration Tests', () => {
    const mockStudents = [
        {
            id: 1,
            rollNo: 'TEST001',
            name: 'Alice Smith',
            email: 'alice@test.com',
            department: 'Computer Science',
            semester: 3,
            courses: [{ id: 101, code: 'CS101' }],
            status: 'active'
        },
        {
            id: 2,
            rollNo: 'TEST002',
            name: 'Bob Jones',
            email: 'bob@test.com',
            department: 'Mathematics',
            semester: 1,
            courses: [],
            status: 'inactive'
        }
    ];

    const mockCourses = [
        { id: 101, code: 'CS101', title: 'Intro to CS' },
        { id: 102, code: 'MA101', title: 'Calculus I' },
    ];

    beforeEach(() => {
        // Reset all mocks before each test to prevent state leakage
        jest.resetAllMocks();
        
        // Setup API successful responses for parallel Promise.allSettled fetching
        api.get.mockImplementation((url) => {
            if (url === '/students') return Promise.resolve({ data: mockStudents });
            if (url === '/courses') return Promise.resolve({ data: mockCourses });
            return Promise.reject(new Error('not found'));
        });
    });

    it('displays loading spinner initially', () => {
        // Delay the promise so we can check the loading state immediately
        api.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        const { container } = render(<Students />);
        
        // Assert spinner is present
        expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('fetches students and courses in parallel and renders the data table', async () => {
        render(<Students />);

        // Wait for the loading spinner to disappear and the table to render the student names
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
        expect(screen.getByText('TEST001')).toBeInTheDocument();
        expect(screen.getAllByText('1')[0]).toBeInTheDocument(); // Course map length

        // Verify API was called twice (once for students, once for courses) due to parallel fetching
        expect(api.get).toHaveBeenCalledTimes(2);
        expect(api.get).toHaveBeenCalledWith('/students', { params: {} });
        expect(api.get).toHaveBeenCalledWith('/courses');
    });

    it('filters the student list based on search input', async () => {
        render(<Students />);
        
        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        // Type into search box
        const searchInput = screen.getByPlaceholderText('Search students…');
        fireEvent.change(searchInput, { target: { value: 'Alice' } });

        // Searching triggers another `fetchData` call, so we should see an additional api.get for students
        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/students', { params: { search: 'Alice' } });
        });
    });

    it('opens the Create Student modal when "Add Student" is clicked', async () => {
        render(<Students />);
        
        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        const addButton = screen.getByText(/Add Student/i);
        fireEvent.click(addButton);

        // Assert modal header appears
        expect(screen.getByRole('heading', { level: 3, name: 'Add Student' })).toBeInTheDocument();
        
        // Assert Create button is in the Footer
        expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('opens the Edit Student modal populated with existing data when Edit is clicked', async () => {
        render(<Students />);
        
        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        // The first row's edit button
        const editButtons = screen.getAllByTestId('icon-edit');
        fireEvent.click(editButtons[0]);

        // Assert Edit Modal opens
        expect(screen.getByRole('heading', { level: 3, name: 'Edit Student' })).toBeInTheDocument();
        
        // Assert the forms are pre-filled with Alice's data
        const inputName = screen.getByDisplayValue('Alice Smith');
        expect(inputName).toBeInTheDocument();
        expect(screen.getByDisplayValue('alice@test.com')).toBeInTheDocument();
    });
});
