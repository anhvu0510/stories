// Text-to-speech functionality for reading stories

// Function to scroll to highlighted element
function scrollToHighlightedWord() {
    console.log("Scrolling to highlighted word");
    const highlightedElements = document.querySelectorAll('.msreadout-word-highlight');
    
    if (highlightedElements.length > 0) {
        // Find the first highlighted element
        const firstHighlighted = highlightedElements[0];
        console.log("Found highlighted element:", firstHighlighted);
        
        // Scroll to the element with smooth animation
        firstHighlighted.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
        
        // Add additional highlighting effect temporarily
        firstHighlighted.classList.add('extra-highlight');
        setTimeout(() => {
            firstHighlighted.classList.remove('extra-highlight');
        }, 2000);
        
        return true;
    } else {
        console.log("No highlighted elements found");
        return false;
    }
}

// Add event listener for the button
document.addEventListener('DOMContentLoaded', function() {
    const scrollToHighlightBtn = document.getElementById('text-to-speech-btn');
    if (scrollToHighlightBtn) {
        scrollToHighlightBtn.addEventListener('click', function(e) {
            console.log("Scroll to highlight button clicked");
            const success = scrollToHighlightedWord();
            
            // Show visual feedback on the button
            if (success) {
                // Add success effect
                scrollToHighlightBtn.classList.add('highlight-found');
                setTimeout(() => {
                    scrollToHighlightBtn.classList.remove('highlight-found');
                }, 1000);
            } else {
                // Add "not found" effect
                scrollToHighlightBtn.classList.add('highlight-not-found');
                setTimeout(() => {
                    scrollToHighlightBtn.classList.remove('highlight-not-found');
                }, 1000);
                
                // Optional: Show a brief message
                const messageElement = document.createElement('div');
                messageElement.className = 'highlight-message';
                messageElement.textContent = 'Không tìm thấy từ được đánh dấu';
                document.body.appendChild(messageElement);
                
                setTimeout(() => {
                    messageElement.classList.add('show');
                }, 10);
                
                setTimeout(() => {
                    messageElement.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(messageElement);
                    }, 300);
                }, 2000);
                
                // Create a sample highlighted word if none exists
                // This is just for testing, can be removed in production
                createSampleHighlight();
            }
        });
    }
    
    // Clean up when page is unloaded or closed
    window.addEventListener('beforeunload', function() {
        // Any cleanup needed
    });
});

// Function to create a sample highlighted word for testing
// This can be removed in production
function createSampleHighlight() {
    // Check if any highlighted elements already exist
    if (document.querySelectorAll('.msreadout-word-highlight').length > 0) {
        return;
    }
    
    // Find a random paragraph to add the highlight to
    const paragraphs = document.querySelectorAll('#chapter-content p');
    if (paragraphs.length > 0) {
        const randomParagraphIndex = Math.floor(Math.random() * paragraphs.length);
        const paragraph = paragraphs[randomParagraphIndex];
        
        // Get the text content
        const text = paragraph.textContent;
        if (text.length > 20) {
            // Find a word to highlight (simple implementation)
            const words = text.split(' ');
            if (words.length > 5) {
                const randomWordIndex = Math.floor(Math.random() * (words.length - 5)) + 5;
                
                // Create new HTML with the highlighted word
                let newHTML = '';
                for (let i = 0; i < words.length; i++) {
                    if (i === randomWordIndex) {
                        newHTML += `<span class="msreadout-word-highlight">${words[i]}</span> `;
                    } else {
                        newHTML += words[i] + ' ';
                    }
                }
                
                // Set the new HTML
                paragraph.innerHTML = newHTML;
                
                console.log("Created sample highlight in paragraph:", randomParagraphIndex);
            }
        }
    }
}
