// DOM element references
const resumeFileInput = document.getElementById('resumeFile');
const loadingIndicator = document.getElementById('loadingIndicator');
const statusMessage = document.getElementById('statusMessage');
const resultArea = document.getElementById('resultArea');
const fileError = document.getElementById('fileError');
const apiError = document.getElementById('apiError');
const fileUploadSection = document.getElementById('fileUploadSection');

// New elements for drag and drop
const dropArea = document.getElementById('dropArea');
const browseFilesButton = document.getElementById('browseFilesButton');

// New elements for the redesigned results
const realAdviceSection = document.getElementById('realAdviceSection');
const getRealAdviceButton = document.getElementById('getRealAdviceButton');

const logoImage = document.getElementById('logoImage');
logoImage.addEventListener('click', resetUIForNewUpload);

// Global variables
let extractedText = "";
let currentMatchedCharacter = ""; // To store the name of the matched character

const characterImages = {
    "Michael Scott": "https://storage.googleapis.com/officecharacters/cast-the-office-michael-scott.webp",
    "Dwight Schrute": "https://storage.googleapis.com/officecharacters/cast-the-office-dwight-schrute.webp",
    "Jim Halpert": "https://storage.googleapis.com/officecharacters/cast-the-office-jim-halpert.webp",
    "Pam Beesly": "https://storage.googleapis.com/officecharacters/cast-the-office-pam-beesly.webp",
    "Stanley Hudson": "https://storage.googleapis.com/officecharacters/cast-the-office-stanley-hudson.webp",
    "Angela Martin": "https://storage.googleapis.com/officecharacters/cast-the-office-angela-martin.webp",
    "Kevin Malone": "https://storage.googleapis.com/officecharacters/cast-the-office-kevin-malone.webp",
    "Oscar Martinez": "https://storage.googleapis.com/officecharacters/cast-the-office-oscar-nunez.webp",
    "Andy Bernard": "https://storage.googleapis.com/officecharacters/cast-the-office-andy-bernard.webp",
    "Phyllis Vance": "https://storage.googleapis.com/officecharacters/cast-the-office-phyllis-vance.webp",
    "Erin Hannon": "https://storage.googleapis.com/officecharacters/cast-the-office-erin-hannon.webp",
    "Toby Flenderson": "https://storage.googleapis.com/officecharacters/cast-the-office-toby-flenderson.webp",
    "Creed Bratton": "https://storage.googleapis.com/officecharacters/cast-the-office-creed-bratton.webp",
    "Meredith Palmer": "https://storage.googleapis.com/officecharacters/cast-the-office-meredith-palmer.webp",
    "Darryl Philbin": "https://storage.googleapis.com/officecharacters/cast-the-office-darryl-philbin.webp",
    "Ryan Howard": "https://storage.googleapis.com/officecharacters/cast-the-office-ryan-howard.webp",
    "Kelly Kapoor": "https://storage.googleapis.com/officecharacters/cast-the-office-kelly-kapoor.webp",
    "Gabe Lewis": "https://storage.googleapis.com/officecharacters/cast-the-office-gabe-lewis.webp",
    "Holly Flax": "https://storage.googleapis.com/officecharacters/cast-the-office-holly-flax.jpg",
    "Jan Levinson": "https://storage.googleapis.com/officecharacters/cast-the-office-jan-levinson.jpg",
    "David Wallace": "https://storage.googleapis.com/officecharacters/cast-the-office-david-wallace.webp",
    "Default Character": "https://storage.googleapis.com/officecharacters/default.jpg"
};

const mainCard = document.querySelector('main.card');

// In the script, hide castImageContainer when showing resultArea, and show it when resetting for new upload
const castImageContainer = document.getElementById('castImageContainer');

let loadingCastInterval = null;
const loadingCastImage = document.getElementById('loadingCastImage');
const loadingIndicatorDiv = document.getElementById('loadingIndicator');
const characterImageUrls = Object.values(characterImages).filter(url => url && url.startsWith('http'));
let castIndex = 0;

// Loading carousel functions
function showLoadingCastCarousel() {
    if (!loadingCastImage || characterImageUrls.length === 0) return;
    loadingCastImage.style.display = 'block';
    castIndex = 0;
    loadingCastImage.src = characterImageUrls[castIndex];
    loadingCastInterval = setInterval(() => {
        castIndex = (castIndex + 1) % characterImageUrls.length;
        loadingCastImage.src = characterImageUrls[castIndex];
    }, 900);
}

function hideLoadingCastCarousel() {
    if (loadingCastInterval) clearInterval(loadingCastInterval);
    if (loadingCastImage) loadingCastImage.style.display = 'none';
}

// UI reset function
function resetUIForNewUpload() {
    resultArea.classList.add('hidden');
    resultArea.innerHTML = ''; // Clear out old advice cards
    apiError.textContent = '';
    fileError.textContent = '';
    fileError.classList.add('hidden');
    statusMessage.textContent = '';
    extractedText = '';
    resumeFileInput.value = '';
    fileUploadSection.classList.remove('hidden');
    loadingIndicator.classList.add('hidden');
    realAdviceSection.classList.add('hidden');
    if (mainCard) mainCard.classList.remove('bg-slate-800');
    if (castImageContainer) castImageContainer.classList.remove('hidden');
}

// Function to handle file processing (from drag/drop or browse)
async function handleFile(file) {
    resetUIForNewUpload(); // Reset UI whenever a new file is handled
    fileUploadSection.classList.remove('hidden'); // Ensure upload section is visible initially

    if (!file) {
        fileError.textContent = "Please select a file first.";
        fileError.classList.remove('hidden');
        return;
    }
    if (file.type !== "application/pdf") {
        fileError.textContent = "Only PDF files are accepted. Please try again.";
        fileError.classList.remove('hidden');
        return;
    }

    fileUploadSection.classList.add('hidden');
    castImageContainer.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    showLoadingCastCarousel();
    statusMessage.classList.remove('hidden');
    statusMessage.textContent = "Reading your resume... don't worry, I'm a fast reader.";
    
    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const pdfData = new Uint8Array(event.target.result);
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ');
                }
                extractedText = text.trim();
                statusMessage.textContent = "Okay, got it. Now, let's see what the Scranton branch thinks...";
                
                await callGeminiAPI(extractedText);

            } catch (error) {
                console.error("Error extracting text from PDF:", error);
                apiError.textContent = "Could not read the PDF. It might be corrupted or empty.";
            } finally {
                loadingIndicator.classList.add('hidden');
                 hideLoadingCastCarousel();
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error("File handling error:", error);
        apiError.textContent = "There was an error processing your file.";
        loadingIndicator.classList.add('hidden');
        hideLoadingCastCarousel();
    }
}

// API call function
async function callGeminiAPI(text) {
    statusMessage.textContent = "Consulting with the regional manager... and friends...";
    
    const apiEndpoint = "https://callgeminionrequest-oi72466uma-uc.a.run.app/callGemini"
    
    const characterList = Object.keys(characterImages).filter(name => name !== "Default Character" && name !== "Holly Flax" && name !== "Jan Levinson" && name !== "David Wallace").join(", ");

    const prompt = `
        Based on the following resume text, your task is to provide funny, snarky, and edgy resume advice from the perspective of three different, randomly selected characters from the US TV show 'The Office'.

        Resume Text: "${text}"

        Instructions:
        1.  Randomly select exactly three distinct characters from this list: ${characterList}.
        2.  For each character, generate one piece of resume advice that is directly relevant to the provided resume text.
        3.  The advice MUST be in the character's specific voice and personality. For example, Dwight's should be intense and strange, Michael's should be well-meaning but misguided, Stanley's should be lazy or about retiring, etc.
        4.  The tone should be humorous, edgy, and a little bit of a "roast," but could contain a grain of truth.
        5.  The advice MUST be concise and punchy, limited to 1-2 sentences.
        6.  Return the response ONLY as a valid JSON array of objects. Each object must have two keys: "character_name" and "advice". Do not include any other text, explanation, or markdown formatting like \`\`\`json.

        Example of a valid response format:
        [
            {
                "character_name": "Michael Scott",
                "advice": "This resume needs more flair! Where are the pictures? The colors? Did you even use WordArt? It's not about experience, it's about creating a feeling."
            },
            {
                "character_name": "Dwight Schrute",
                "advice": "Your 'skills' section is weak. Can you skin a mule deer in under 10 minutes? Can you identify the 50 species of poisonous North American berries? These are the real-world skills employers need. Add them."
            },
            {
                "character_name": "Kevin Malone",
                "advice": "You used a lot of big words. When I was in accounting, we just used small words. 'More money good.' 'Less work good.' It saves time. See? Simple."
            }
        ]
    `;

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: prompt
        });

        if (!response.ok) {
            console.log(response);
            const errorBody = await response.json();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const rawResponseText = data.candidates[0].content.parts[0].text;
        
        // Clean the response text to ensure it's valid JSON
        const cleanedJsonString = rawResponseText.trim().replace(/^```json\s*|```\s*$/g, '');

        const adviceData = JSON.parse(cleanedJsonString);
        displayResults(adviceData);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        apiError.textContent = `Failed to get advice from The Office crew. Error: ${error.message}`;
    } finally {
        statusMessage.classList.add('hidden');
    }
}

// Results display function
function displayResults(adviceData) {
    resultArea.innerHTML = ''; // Clear previous results
    
    adviceData.forEach(item => {
        const characterImageURL = characterImages[item.character_name] || characterImages["Default Character"];
        
        const cardHTML = `
            <div class="bg-indigo-950/80 backdrop-blur-sm rounded-xl p-4 md:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 transition-all duration-300 hover:bg-indigo-900/90 mx-auto" style="max-width: 800px;">
                <img src="${characterImageURL}" alt="${item.character_name}" class="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-blue-400 flex-shrink-0">
                <div class="flex-grow text-center sm:text-left">
                    <h3 class="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">${item.character_name} says:</h3>
                    <div class="relative">
                        <p class="advice-text text-lg md:text-xl">${item.advice}</p>
                    </div>
                </div>
            </div>
        `;
        resultArea.innerHTML += cardHTML;
    });

    resultArea.classList.remove('hidden');
    realAdviceSection.classList.remove('hidden');
}

// Event listeners
// Event listener for hidden file input (for "Browse Files" button)
resumeFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// Event listener for "Browse Files" button click
browseFilesButton.addEventListener('click', () => {
    resumeFileInput.click(); // Programmatically click the hidden file input
});

// Drag and drop functionality
// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    // remove old background
    dropArea.classList.remove('from-blue-900', 'via-indigo-900', 'to-purple-900');
    // add new background
    dropArea.classList.add('from-pink-500', 'via-red-500', 'to-yellow-500');
}

function unhighlight(e) {
    // remove new background
    dropArea.classList.remove('from-pink-500', 'via-red-500', 'to-yellow-500');
    // add old background back
    dropArea.classList.add('from-blue-900', 'via-indigo-900', 'to-purple-900');
}

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;
    handleFile(files[0]);
} 