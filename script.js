// Admission Form Validation and Storage
document.addEventListener('DOMContentLoaded', function() {
    const admissionForm = document.getElementById('admissionForm');
    if (admissionForm) {
        admissionForm.addEventListener('submit', handleFormSubmit);
    }
});

function handleFormSubmit(event) {
    event.preventDefault();

    // Clear previous errors
    clearErrors();

    // Get form values
    const name = document.getElementById('name').value.trim();
    const dob = document.getElementById('dob').value;
    const marks = document.getElementById('marks').value;
    const category = document.getElementById('category').value;
    const course = document.getElementById('course').value;

    // Validate form
    let isValid = true;

    if (!name) {
        showError('nameError', 'Name is required');
        isValid = false;
    } else if (name.length < 2) {
        showError('nameError', 'Name must be at least 2 characters long');
        isValid = false;
    }

    if (!dob) {
        showError('dobError', 'Date of birth is required');
        isValid = false;
    } else {
        const birthDate = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 17 || age > 25) {
            showError('dobError', 'Age must be between 17 and 25 years');
            isValid = false;
        }
    }

    if (!marks) {
        showError('marksError', 'Marks are required');
        isValid = false;
    } else if (marks < 0 || marks > 100) {
        showError('marksError', 'Marks must be between 0 and 100');
        isValid = false;
    }

    if (!category) {
        showError('categoryError', 'Please select a category');
        isValid = false;
    }

    if (!course) {
        showError('courseError', 'Please select a course');
        isValid = false;
    }

    if (isValid) {
        // Create student object
        const student = {
            id: Date.now(), // Unique ID
            name: name,
            dob: dob,
            marks: parseFloat(marks),
            category: category,
            course: course,
            applicationDate: new Date().toISOString()
        };

        // Store in localStorage
        saveStudentData(student);

        // Show success message
        showSuccessMessage();

        // Reset form
        admissionForm.reset();
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error');
    errorElements.forEach(element => {
        element.textContent = '';
    });
}

function saveStudentData(student) {
    // Get existing students from localStorage
    let students = JSON.parse(localStorage.getItem('students')) || [];

    // Add new student
    students.push(student);

    // Save back to localStorage
    localStorage.setItem('students', JSON.stringify(students));
}

function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';

    // Hide message after 5 seconds
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 5000);
}

// Default cutoff marks (will be loaded from localStorage or use defaults)
const defaultCutoffs = {
    "BSc Computer Science": { "General": 90, "BC": 85, "MBC": 80, "SC": 75 },
    "BCA": { "General": 85, "BC": 80, "MBC": 75, "SC": 70 },
    "BCom": { "General": 80, "BC": 75, "MBC": 70, "SC": 65 },
    "BA English": { "General": 75, "BC": 70, "MBC": 65, "SC": 60 },
    "BSc Mathematics": { "General": 85, "BC": 80, "MBC": 75, "SC": 70 },
    "BBA": { "General": 80, "BC": 75, "MBC": 70, "SC": 65 }
};

// Load cutoff marks from localStorage or use defaults
function getCutoffs() {
    const storedCutoffs = localStorage.getItem('cutoffs');
    return storedCutoffs ? JSON.parse(storedCutoffs) : defaultCutoffs;
}

// Save cutoff marks to localStorage
function saveCutoffs(cutoffs) {
    localStorage.setItem('cutoffs', JSON.stringify(cutoffs));
}

// Display cutoff marks on cutoff page
function displayCutoffs() {
    const cutoffs = getCutoffs();
    const tableBody = document.getElementById('cutoffTableBody');

    if (tableBody) {
        tableBody.innerHTML = '';

        Object.keys(cutoffs).forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course}</td>
                <td>${cutoffs[course].General}</td>
                <td>${cutoffs[course].BC}</td>
                <td>${cutoffs[course].MBC}</td>
                <td>${cutoffs[course].SC}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Generate merit list based on cutoff marks
function generateMeritList() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const cutoffs = getCutoffs();

    if (students.length === 0) {
        document.getElementById('noDataMessage').style.display = 'block';
        document.getElementById('meritTable').style.display = 'none';
        return;
    }

    document.getElementById('noDataMessage').style.display = 'none';
    document.getElementById('meritTable').style.display = 'table';

    // Update statistics
    document.getElementById('totalStudents').textContent = students.length;

    // Filter and sort students
    const meritList = students.map(student => {
        const cutoff = cutoffs[student.course] ? cutoffs[student.course][student.category] : 0;
        const isSelected = student.marks >= cutoff;

        return {
            ...student,
            cutoff: cutoff,
            status: isSelected ? 'Selected' : 'Rejected'
        };
    }).sort((a, b) => {
        // Sort by status (Selected first), then by marks descending
        if (a.status !== b.status) {
            return a.status === 'Selected' ? -1 : 1;
        }
        return b.marks - a.marks;
    });

    const selectedCount = meritList.filter(student => student.status === 'Selected').length;
    document.getElementById('selectedStudents').textContent = selectedCount;
    document.getElementById('rejectionRate').textContent =
        students.length > 0 ? Math.round(((students.length - selectedCount) / students.length) * 100) + '%' : '0%';

    // Display merit list
    const tableBody = document.getElementById('meritTableBody');
    tableBody.innerHTML = '';

    meritList.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.course}</td>
            <td>${student.category}</td>
            <td>${student.marks}</td>
            <td>${student.cutoff}</td>
            <td class="${student.status === 'Selected' ? 'status-selected' : 'status-rejected'}">${student.status}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Handle admin cutoff form submission
function handleCutoffFormSubmit(event) {
    event.preventDefault();

    const cutoffs = {};

    // Collect cutoff values from form
    const courses = ['bsc-cs', 'bca', 'bcom', 'ba-english', 'bsc-math', 'bba'];
    const courseNames = ['BSc Computer Science', 'BCA', 'BCom', 'BA English', 'BSc Mathematics', 'BBA'];
    const categories = ['general', 'bc', 'mbc', 'sc'];

    courses.forEach((course, index) => {
        cutoffs[courseNames[index]] = {};
        categories.forEach(category => {
            const inputId = `${course}-${category}`;
            const value = parseFloat(document.getElementById(inputId).value);
            cutoffs[courseNames[index]][category.charAt(0).toUpperCase() + category.slice(1)] = value;
        });
    });

    // Save cutoffs
    saveCutoffs(cutoffs);

    // Show success message
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';

    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// Load cutoff values into admin form
function loadCutoffForm() {
    const cutoffs = getCutoffs();

    Object.keys(cutoffs).forEach(course => {
        Object.keys(cutoffs[course]).forEach(category => {
            const courseId = course.toLowerCase().replace(/\s+/g, '-');
            const categoryId = category.toLowerCase();
            const inputId = `${courseId}-${categoryId}`;
            const input = document.getElementById(inputId);

            if (input) {
                input.value = cutoffs[course][category];
            }
        });
    });
}

// Admin Panel Functions
function handleAdminLogin(event) {
    event.preventDefault();

    const adminName = document.getElementById('adminName').value.trim();

    // Validate admin name
    if (!adminName) {
        alert('Please enter your admin name');
        return;
    }

    // Store admin name in localStorage
    localStorage.setItem('adminName', adminName);

    // Show admin dashboard and hide login
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';

    // Update welcome message
    document.getElementById('adminWelcomeName').textContent = adminName;

    // Load any existing cutoff calculation data
    loadAdminData();
}

function handleCutoffCalculation(event) {
    event.preventDefault();

    // Get input values
    const mathsMarks = parseFloat(document.getElementById('mathsMarks').value);
    const physicsMarks = parseFloat(document.getElementById('physicsMarks').value);
    const chemistryMarks = parseFloat(document.getElementById('chemistryMarks').value);

    // Validate inputs
    if (isNaN(mathsMarks) || isNaN(physicsMarks) || isNaN(chemistryMarks)) {
        alert('Please enter valid marks for all subjects');
        return;
    }

    if (mathsMarks < 0 || mathsMarks > 100 || physicsMarks < 0 || physicsMarks > 100 || chemistryMarks < 0 || chemistryMarks > 100) {
        alert('Marks must be between 0 and 100');
        return;
    }

    // Calculate cutoff using formula: (Maths / 2) + (Physics / 4) + (Chemistry / 4)
    const cutoff = (mathsMarks / 2) + (physicsMarks / 4) + (chemistryMarks / 4);

    // Display result with 2 decimal places
    document.getElementById('cutoffValue').textContent = cutoff.toFixed(2);
    document.getElementById('cutoffResult').style.display = 'block';

    // Store data in localStorage as JSON
    const adminData = {
        adminName: localStorage.getItem('adminName'),
        mathsMarks: mathsMarks,
        physicsMarks: physicsMarks,
        chemistryMarks: chemistryMarks,
        calculatedCutoff: cutoff.toFixed(2),
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('adminCutoffData', JSON.stringify(adminData));
}

function loadAdminData() {
    const adminData = JSON.parse(localStorage.getItem('adminCutoffData'));

    if (adminData) {
        // Populate form fields with stored data
        document.getElementById('mathsMarks').value = adminData.mathsMarks;
        document.getElementById('physicsMarks').value = adminData.physicsMarks;
        document.getElementById('chemistryMarks').value = adminData.chemistryMarks;

        // Show previous result if available
        if (adminData.calculatedCutoff) {
            document.getElementById('cutoffValue').textContent = adminData.calculatedCutoff;
            document.getElementById('cutoffResult').style.display = 'block';
        }
    }
}

function handleAdminLogout() {
    // Clear admin session
    localStorage.removeItem('adminName');

    // Show login section and hide dashboard
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';

    // Clear form
    document.getElementById('loginForm').reset();
    document.getElementById('cutoffCalculationForm').reset();
    document.getElementById('cutoffResult').style.display = 'none';
}

function checkAdminLogin() {
    const adminName = localStorage.getItem('adminName');

    if (adminName) {
        // Admin is logged in, show dashboard
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        document.getElementById('adminWelcomeName').textContent = adminName;
        loadAdminData();
    } else {
        // Show login section
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('adminDashboard').style.display = 'none';
    }
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Admission form
    const admissionForm = document.getElementById('admissionForm');
    if (admissionForm) {
        admissionForm.addEventListener('submit', handleFormSubmit);
    }

    // Cutoff page
    if (document.getElementById('cutoffTable')) {
        displayCutoffs();
    }

    // Merit list page
    if (document.getElementById('meritTable')) {
        generateMeritList();
    }

    // Admin page - New functionality
    const loginForm = document.getElementById('loginForm');
    const cutoffCalculationForm = document.getElementById('cutoffCalculationForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
        checkAdminLogin(); // Check if admin is already logged in
    }

    if (cutoffCalculationForm) {
        cutoffCalculationForm.addEventListener('submit', handleCutoffCalculation);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }

    // Old admin functionality (keeping for backward compatibility)
    const cutoffForm = document.getElementById('cutoffForm');
    if (cutoffForm) {
        loadCutoffForm();
        cutoffForm.addEventListener('submit', handleCutoffFormSubmit);
    }
});
