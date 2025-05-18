const floatingMenuList = document.getElementById("floating-menu-list");
const floatingMenuBackdrop = document.getElementById("floating-menu-backdrop");
const menuButtons = document.querySelectorAll(
  "#floating-menu-list .menu-item button"
);
const floatingMenuButton = document.getElementById("floating-menu-button");

// Add console log to show when menu button is ready
console.log(
  "Floating menu button initialized:",
  floatingMenuButton ? "found" : "not found"
);

// Initialize menu items when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing menu items");
  // Initialize menu items only once
  initializeMenuItems();

  // Add subtle movement effect to menu items
  const menuItems = document.querySelectorAll("#floating-menu-list .menu-item");
  menuItems.forEach((item, index) => {
    item.addEventListener("mousemove", function (e) {
      const button = item.querySelector("button");
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Apply subtle tilt effect
      button.style.transform = `scale(1.15) perspective(300px) rotateX(${
        y * -0.05
      }deg) rotateY(${x * 0.05}deg)`;
    });

    item.addEventListener("mouseleave", function () {
      const button = item.querySelector("button");
      button.style.transform = "";
    });
  });

  // Add animation delays to menu items
  menuItems.forEach((item, index) => {
    item.style.setProperty("--item-index", index);
  });

  // Floating menu button click event
  floatingMenuButton.addEventListener("click", function () {
    console.log("Floating menu button clicked");
    floatingMenuList.classList.toggle("show");
    floatingMenuButton.classList.toggle("active");
    floatingMenuBackdrop.classList.toggle("show");
  });

  // Close menu button click event
  document.getElementById("close-menu").addEventListener("click", () => {
    console.log("close-menu button clicked");
    const chapterMenu = document.getElementById("chapter-menu");
    const menuOverlay = document.getElementById("menu-overlay");
    const showChapterListButton = document.getElementById("show-chapter-list");

    toggleUIElement(chapterMenu, menuOverlay, false);

  });

  // Menu overlay click event
  document.getElementById("menu-overlay").addEventListener("click", () => {
    const chapterMenu = document.getElementById("chapter-menu");
    const menuOverlay = document.getElementById("menu-overlay");
    toggleUIElement(chapterMenu, menuOverlay, false);
  });

  // Close menu when clicking outside
  floatingMenuBackdrop.addEventListener("click", () => {
    floatingMenuList.classList.remove("show");
    floatingMenuButton.classList.remove("active");
    floatingMenuBackdrop.classList.remove("show");
  });

  // Attach event listener for opening settings modal
  document
    .getElementById("menu-setting-btn")
    .addEventListener("click", function () {
      const settingsModal = document.getElementById("settings-modal");
      const modalOverlay = document.getElementById("modal-overlay");
      const chapterMenu = document.getElementById("chapter-menu");
      const menuOverlay = document.getElementById("menu-overlay");

      // Close menu first
      if (chapterMenu && menuOverlay) {
        toggleUIElement(chapterMenu, menuOverlay, false);
      }

      // Open settings modal
      if (settingsModal && modalOverlay) {
        toggleModal(settingsModal, modalOverlay, true);
      }
    });

  // Attach event listener for closing settings modal
  document
    .getElementById("close-settings")
    .addEventListener("click", function () {
      const settingsModal = document.getElementById("settings-modal");
      const modalOverlay = document.getElementById("modal-overlay");
      toggleModal(settingsModal, modalOverlay, false);
    });

  // Attach event listener for saving settings
  document
    .getElementById("save-settings")
    .addEventListener("click", function () {
      // Collect settings
      const settings = {
        fontFamily: document.getElementById("font-family").value,
        fontSize: document.getElementById("font-size-display").textContent,
        linesPerSentence: document.getElementById("lines-per-sentence-display")
          .textContent,
      };

      // Save all settings to local storage
      Object.entries(settings).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      // Close settings modal
      const settingsModal = document.getElementById("settings-modal");
      const modalOverlay = document.getElementById("modal-overlay");
      toggleModal(settingsModal, modalOverlay, false);
    });

  // Event listeners for settings modal controls
  
  // Font size controls
  const decreaseFontSizeBtn = document.getElementById("decrease-font-size");
  const increaseFontSizeBtn = document.getElementById("increase-font-size");
  const fontSizeDisplay = document.getElementById("font-size-display");
  
  if (decreaseFontSizeBtn && increaseFontSizeBtn && fontSizeDisplay) {
    decreaseFontSizeBtn.addEventListener("click", function() {
      let fontSize = parseInt(fontSizeDisplay.textContent);
      if (fontSize > 10) {
        fontSize -= 1;
        fontSizeDisplay.textContent = fontSize;
        updatePreview();
      }
    });
    
    increaseFontSizeBtn.addEventListener("click", function() {
      let fontSize = parseInt(fontSizeDisplay.textContent);
      if (fontSize < 40) {
        fontSize += 1;
        fontSizeDisplay.textContent = fontSize;
        updatePreview();
      }
    });
  }
  
  // Lines per sentence controls
  const decreaseLinesBtn = document.getElementById("decrease-lines-per-sentence");
  const increaseLinesBtn = document.getElementById("increase-lines-per-sentence");
  const linesDisplay = document.getElementById("lines-per-sentence-display");
  
  if (decreaseLinesBtn && increaseLinesBtn && linesDisplay) {
    decreaseLinesBtn.addEventListener("click", function() {
      let lines = parseInt(linesDisplay.textContent);
      if (lines > 1) {
        lines -= 1;
        linesDisplay.textContent = lines;
        updatePreview();
      }
    });
    
    increaseLinesBtn.addEventListener("click", function() {
      let lines = parseInt(linesDisplay.textContent);
      if (lines < 10) {
        lines += 1;
        linesDisplay.textContent = lines;
        updatePreview();
      }
    });
  }
  
  // Font family controls
  const fontFamilySelect = document.getElementById("font-family");
  if (fontFamilySelect) {
    fontFamilySelect.addEventListener("change", function() {
      updatePreview();
    });
    
    // Set initial value from localStorage if available
    const savedFontFamily = localStorage.getItem("fontFamily");
    if (savedFontFamily) {
      fontFamilySelect.value = savedFontFamily;
    }
  }
  
  // Preview function to show changes in real-time
  function updatePreview() {
    const chapterContent = document.getElementById("chapter-content");
    if (chapterContent) {
      if (fontSizeDisplay) {
        chapterContent.style.fontSize = fontSizeDisplay.textContent + "px";
      }
      
      if (fontFamilySelect) {
        chapterContent.style.fontFamily = fontFamilySelect.value;
      }
      
      // For lines per sentence, we'd need to reprocess the content
      // This might be handled elsewhere in your code
    }
  }
  
  // Modal controls
  const menuSettingBtn = document.getElementById("menu-setting-btn");
  const closeSettingsBtn = document.getElementById("close-settings");
  const saveSettingsBtn = document.getElementById("save-settings");
  const settingsModal = document.getElementById("settings-modal");
  const modalOverlay = document.getElementById("modal-overlay");
  
  if (menuSettingBtn) {
    menuSettingBtn.addEventListener("click", function () {
      if (settingsModal && modalOverlay) {
        toggleModal(settingsModal, modalOverlay, true);
      }
    });
  }
  
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener("click", function () {
      if (settingsModal && modalOverlay) {
        toggleModal(settingsModal, modalOverlay, false);
      }
    });
  }
  
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", function () {
      // Save settings to localStorage
      if (fontSizeDisplay) {
        localStorage.setItem("fontSize", fontSizeDisplay.textContent);
      }
      
      if (linesDisplay) {
        localStorage.setItem("linesPerSentence", linesDisplay.textContent);
      }
      
      if (fontFamilySelect) {
        localStorage.setItem("fontFamily", fontFamilySelect.value);
      }
      
      // Close modal
      if (settingsModal && modalOverlay) {
        toggleModal(settingsModal, modalOverlay, false);
      }
      
      // Apply settings immediately
      updatePreview();
    });
  }

  // Regex Replace Functionality
  const addRegexReplaceBtn = document.getElementById("add-regex-replace");
  const regexMatchInput = document.getElementById("regex-match");
  const regexReplaceInput = document.getElementById("regex-replace");
  const regexReplaceList = document.getElementById("regex-replace-list");
  

  
  // Function to save regex replacements to localStorage
  function saveRegexReplacements() {
    const items = [];
    Array.from(regexReplaceList.children).forEach(item => {
      const matchInput = item.querySelector("input:first-of-type");
      const replaceInput = item.querySelector("input:nth-of-type(2)");
      if (matchInput && replaceInput) {
        items.push({
          match: matchInput.value,
          replace: replaceInput.value
        });
      }
    });
    
    localStorage.setItem("regexReplacements", JSON.stringify(items));
    console.log("Saved regex replacements:", items.length);
    
    // Apply regex replacements to current content
    applyRegexReplacements();
  }
  
  // Function to apply regex replacements to content
  function applyRegexReplacements() {
    const chapterContent = document.getElementById("chapter-content");
    if (!chapterContent) return;
    
    // Get saved regex replacements
    let content = chapterContent.innerHTML;
    const savedRegexReplacements = JSON.parse(localStorage.getItem("regexReplacements") || "[]");
    
    savedRegexReplacements.forEach(item => {
      try {
        const regex = new RegExp(item.match, "g");
        content = content.replace(regex, item.replace);
      } catch (error) {
        console.error("Invalid regex:", item.match, error);
      }
    });
    
    chapterContent.innerHTML = content;
  }
  
  // Add new regex replacement
  if (addRegexReplaceBtn && regexMatchInput && regexReplaceInput && regexReplaceList) {
    addRegexReplaceBtn.addEventListener("click", function() {
      const matchValue = regexMatchInput.value.trim();
      const replaceValue = regexReplaceInput.value;
      
      if (matchValue) {
        // Create list item
        const listItem = document.createElement("li");
        
        // Create match input (read-only)
        const matchInput = document.createElement("input");
        matchInput.type = "text";
        matchInput.value = matchValue;
        matchInput.readOnly = true;
        
        // Create replace input (read-only)
        const replaceInput = document.createElement("input");
        replaceInput.type = "text";
        replaceInput.value = replaceValue;
        replaceInput.readOnly = true;
        
        // Create delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.classList.add("delete-regex");
        deleteButton.addEventListener("click", function() {
          regexReplaceList.removeChild(listItem);
          updateRegexCount();
          saveRegexReplacements();
        });
        
        // Add elements to list item
        listItem.appendChild(matchInput);
        listItem.appendChild(replaceInput);
        listItem.appendChild(deleteButton);
        
        // Add to beginning of list
        regexReplaceList.insertBefore(listItem, regexReplaceList.firstChild);
        
        // Clear inputs
        regexMatchInput.value = "";
        regexReplaceInput.value = "";
        
        // Update count and save
        updateRegexCount();
        saveRegexReplacements();
      }
    });
    
    // Add Enter key support for regex inputs
    regexReplaceInput.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        addRegexReplaceBtn.click();
      }
    });
  }

  // Fix font-family dropdown issues
  const fontFamilyDropdown = document.getElementById("font-family");
  
  if (fontFamilyDropdown) {
    // Ensure dropdown is working correctly
    fontFamilyDropdown.addEventListener('click', function(e) {
      console.log('Font family dropdown clicked');
      // Force dropdown to display when clicked
      setTimeout(() => {
        // Sometimes we need to force the focus for the native dropdown to appear
        fontFamilyDropdown.focus();
      }, 50);
    });
    
    // Set initial value from localStorage if available
    const savedFontFamily = localStorage.getItem("fontFamily");
    if (savedFontFamily) {
      fontFamilyDropdown.value = savedFontFamily;
      console.log("Loaded saved font family:", savedFontFamily);
    }
  }
});

// Xử lý cho touchstart đơn giản hơn, không ngăn chặn hành vi mặc định
floatingMenuButton.addEventListener("touchstart", (e) => {
  console.log("Floating menu button touch started");
});

// Xử lý cho các nút trong menu
document.querySelectorAll("#floating-menu-list button").forEach((button) => {
  button.addEventListener("click", (e) => {
    console.log("Menu item button clicked");
  });
});

// Connect menu item functions
// Initialize menu item functionality
function initializeMenuItems() {
    // Get menu items
    const uploadButton = document.querySelector(
        "#floating-menu-list .menu-item:nth-child(1) button"
    );
    const settingsButton = document.querySelector(
        "#floating-menu-list .menu-item:nth-child(2) button"
    );
    const showChapterListButton = document.getElementById("show-chapter-list");

    // Upload file button
    if (uploadButton) {
        uploadButton.addEventListener("click", function () {
            // Close floating menu
            floatingMenuList.classList.remove("show");
            floatingMenuButton.classList.remove("active");
            floatingMenuBackdrop.classList.remove("show");

            // Trigger file input
            const fileInput = document.getElementById("file-input");
            if (fileInput) {
                fileInput.addEventListener("change", function (event) {
                    const file = event.target.files[0];
                    console.log({ file });
                    if (file) {
                        console.log("File selected:", file.name);
                        processChapterData(file);
                    } else {
                        console.error("No file selected");
                    }
                });

                fileInput.value = ""; // Reset value to allow selecting the same file again
                fileInput.click();
            }
        });
    }

    // Settings button
    if (settingsButton) {
        settingsButton.addEventListener("click", function () {
            // Close floating menu
            floatingMenuList.classList.remove("show");
            floatingMenuButton.classList.remove("active");
            floatingMenuBackdrop.classList.remove("show");

            // Open settings modal
            const settingsModal = document.getElementById("settings-modal");
            const modalOverlay = document.getElementById("modal-overlay");
            if (settingsModal && modalOverlay) {
                toggleModal(settingsModal, modalOverlay, true);
            }
        });
    }

    // Show chapter list button (replaces home button)
    if (showChapterListButton) {
        showChapterListButton.addEventListener("click", () => {
            // Close floating menu
            floatingMenuList.classList.remove("show");
            floatingMenuButton.classList.remove("active");
            floatingMenuBackdrop.classList.remove("show");

            // Show chapter menu
            const chapterMenu = document.getElementById("chapter-menu");
            const menuOverlay = document.getElementById("menu-overlay");
            console.log({ chapterMenu, menuOverlay });
            if (chapterMenu && menuOverlay) {
                chapterMenu.classList.add("open");
                menuOverlay.classList.add("open");
                menuOverlay.style.display = "block";
                console.log("Showed chapter list from floating menu");
            } else {
                console.error("Chapter menu or overlay not found");
            }
        });
    }
}

// Show and hide loading spinner functions
function showLoadingSpinner() {
  const loadingSpinner = document.getElementById("loading-spinner");
  loadingSpinner.style.display = "block";
}

function hideLoadingSpinner() {
  const loadingSpinner = document.getElementById("loading-spinner");
  loadingSpinner.style.display = "none";
}

// Wrap the chapterData processing with loading spinner
async function processChapterData(file) {
  try {
    showLoadingSpinner();
    console.log("Starting to process file:", file);

    const content = await readFileContent(file); // Read file content

    const chapters = splitIntoChapters(content, 2); // Split content into chapters
    window.chapterData = chapters; // Save chapters globally
    console.log("window.chapterData updated:", window.chapterData);

    // Update the story name based on the uploaded file name
    const storyNameElement = document.getElementById("story-name");
    if (storyNameElement) {
      storyNameElement.textContent = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
    }

    // Clear old content and initialize lazy loading
    const container = document.getElementById("chapter-content");
    container.innerHTML = ""; // Clear container content
    lazyLoadData(); // Initialize lazy loading

    // Populate the menu with chapter data
    populateChapterMenu(chapters);

    // Đợi cho quá trình xử lý hoàn tất rồi mới áp dụng cài đặt
    console.log("File processing complete, now applying stored settings...");

    // Áp dụng các cài đặt đã lưu cho truyện hiện tại
    applyStoredSettings();

    // Khôi phục vị trí cuộn đã lưu sau khi áp dụng cài đặt

    restoreScrollPosition();
  } catch (error) {
    console.error("Error processing chapter data:", error);
  } finally {
    hideLoadingSpinner();
  }
}

// Hàm đọc nội dung từ file
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); // Tạo một đối tượng FileReader để đọc file
    reader.onload = (event) => resolve(event.target.result); // Trả về nội dung file khi đọc xong
    reader.onerror = (error) => reject(error); // Trả về lỗi nếu có lỗi xảy ra
    reader.readAsText(file); // Đọc file dưới dạng văn bản
  });
}

// Lưu dữ liệu vào Local Storage
function saveToLocalStorage(key, data) {

  const storeName = document.getElementById("story-name").textContent.toLowerCase().replace(/\s+/g, "_");
  console.log('save', { storeName, data });
  
  let dataStore = {};
  if (!localStorage.getItem(storeName)) {
    dataStore[key] = data;
  } else {
    const oldData = JSON.parse(localStorage.getItem(storeName));
    dataStore = { ...oldData, [key]: data };
  }
  localStorage.setItem(storeName, JSON.stringify(dataStore));
}

// Tải dữ liệu từ Local Storage
function loadFromLocalStorage(key) {
  const storeName = document
    .getElementById("story-name")
    .textContent.toLowerCase()
    .replace(/\s+/g, "_");
  console.log('load', { storeName });
  const data = localStorage.getItem(storeName);
  if (!data) return null;
  try {
    const obj = JSON.parse(data);
    return obj[key] !== undefined ? obj[key] : null;
  } catch (e) {
    return null;
  }
}

// Lưu vị trí cuộn hiện tại
function saveScrollPosition() {
  const container = document.getElementById("chapter-content");
  const chapters = document.querySelectorAll(".chapter");

  saveToLocalStorage("lastScrollPosition", container.scrollTop); // Lưu vị trí cuộn vào Local Storage
  saveToLocalStorage("chapterNumber", getVisibleChapter(chapters)); // Lưu vị trí cuộn vào Local Storage
}

// Khôi phục vị trí cuộn đã lưu
function restoreScrollPosition() {
  const chapterNumber = loadFromLocalStorage("chapterNumber");
  scrollToChapter(chapterNumber ?? 1);

  const container = document.getElementById("chapter-content");
  const lastScrollPosition = loadFromLocalStorage("lastScrollPosition"); // Lấy vị trí cuộn đã lưu
  if (lastScrollPosition !== null) {
    container.scrollTop = lastScrollPosition; // Đặt lại vị trí cuộn
  }
}

// Utility function to chunk an array into smaller arrays of a specified size
function chunkArray(array, size) {
  if (!Array.isArray(array) || size <= 0) {
    throw new Error(
      "Invalid input: array must be an array and size must be a positive number."
    );
  }
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Hàm tách nội dung thành các chương
function splitIntoChapters(content, linesPerSentence = 3) {
  const regexSplitStory = "#Chương";
  function isNumber(value) {
    return /^\d+$/.test(value);
  }

  const storyEdited = content
    .split(/\n/)
    .filter(Boolean)
    .map((line) => {
      let lineContent = line.trim();
      const lines = line.replace(/\t/g, "").trim().split(" ");
      const firstItem = lines.shift();
      let chapterNumber = lines.shift();
      const isChapterNumber =
        chapterNumber && isNumber(chapterNumber.replace(/\D/g, ""));
      if (
        isChapterNumber &&
        lines.length < 20 &&
        ["chương", "thứ"].includes(firstItem.toLowerCase()) === true
      ) {
        lineContent = `#Chương ${lines.join(" ")}_${chapterNumber}_`;
      }
      return lineContent;
    })
    .join("\n");

  const chapters = storyEdited.split(regexSplitStory).filter(Boolean);

  return chapters.map((chapter) => {
    let [chapterName = "", chapterNumber = "", chapterContent = ""] = [
      "",
      "",
      "",
    ];
    if (chapter.includes("_")) {
      [chapterName = "", chapterNumber = "", chapterContent = ""] =
        chapter.split("_");
    } else {
      chapterContent = chapter;
    }

    chapterNumber = +chapterNumber.replace(/\D/g, "") ?? 0;

    // Use chunkArray to split content into sentences
    const contentLines = chapterContent
      .split("\n")
      .filter(Boolean)
      .map((line) => line.trim());
    const combinedContent = chunkArray(contentLines, linesPerSentence).map(
      (chunk) => chunk.join("")
    );
    return {
      chapterNumber,
      title: `Chương ${chapterNumber} ${chapterName.trim()}`,
      content: combinedContent,
    };
  });
}

// Rebuild content dynamically based on chapter data
function rebuildContentFromChapters(chapters) {
  const container = document.getElementById("chapter-content");
  container.innerHTML = ""; // Clear existing content

  chapters.forEach((chapter, index) => {
    const chapterDiv = document.createElement("div");
    chapterDiv.classList.add("chapter");
    chapterDiv.id = `chapter-${index}`; // Add ID for linking

    const title = document.createElement("h5");
    title.classList.add("chapter-title"); // Added the CSS class 'chapter-title'
    title.textContent = chapter.title; // Set chapter title
    chapterDiv.appendChild(title);

    chapter.content.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph; // Set paragraph content
      chapterDiv.appendChild(p);
    });

    container.appendChild(chapterDiv); // Add chapter to container
  });
}

// Update lazy loading to ensure scrollbar reflects current DOM content
function lazyLoadData() {
  const container = document.getElementById("chapter-content");
  const batchSize = 2; // Number of chapters to load per batch
  const maxElements = 6; // Max number of chapters in the DOM
  let currentIndex = 1;

  function loadMoreData(direction) {
    if (!window.chapterData) return; // Exit if no data

    if (direction === "down") {
      const next = +(
        document
          .querySelector("#chapter-content")
          ?.lastChild?.id?.split("-")[1] ?? 1
      );
      const nextBatch = window.chapterData
        .filter(
          (chapter) =>
            chapter.chapterNumber >= next &&
            chapter.chapterNumber < next + batchSize
        )
        .sort((a, b) => a.chapterNumber - b.chapterNumber);

      nextBatch.forEach((chapter) => {
        if (!document.getElementById(`chapter-${chapter.chapterNumber}`)) {
          const chapterDiv = document.createElement("div");
          chapterDiv.classList.add("chapter");
          chapterDiv.id = `chapter-${chapter.chapterNumber}`;

          const title = document.createElement("h5");
          title.classList.add("chapter-title");
          title.textContent = chapter.title;
          chapterDiv.appendChild(title);

          chapter.content.forEach((paragraph) => {
            const p = document.createElement("p");
            p.textContent = paragraph;
            chapterDiv.appendChild(p);
          });

          container.appendChild(chapterDiv);
        }
      });

      currentIndex += batchSize;

      while (container.children.length > maxElements) {
        container.removeChild(container.firstChild);
      }

      // Adjust container height to match current content
      container.style.height = `${container.scrollHeight}px`;
    } else if (direction === "up" && currentIndex > batchSize) {
      const prev = +(
        document
          .querySelector("#chapter-content")
          .firstChild?.id?.split("-")[1] ?? 1
      );
      const previousBatch = window.chapterData
        .filter(
          (chapter) =>
            chapter.chapterNumber >= prev - batchSize &&
            chapter.chapterNumber < prev
        )
        .sort((a, b) => b.chapterNumber - a.chapterNumber);

      previousBatch.forEach((chapter) => {
        if (!document.getElementById(`chapter-${chapter.chapterNumber}`)) {
          const chapterDiv = document.createElement("div");
          chapterDiv.classList.add("chapter");
          chapterDiv.id = `chapter-${chapter.chapterNumber}`;

          const title = document.createElement("h5");
          title.classList.add("chapter-title");
          title.textContent = chapter.title;
          chapterDiv.appendChild(title);

          chapter.content.forEach((paragraph) => {
            const p = document.createElement("p");
            p.textContent = paragraph;
            chapterDiv.appendChild(p);
          });

          container.insertBefore(chapterDiv, container.firstChild);
        }
      });

      currentIndex -= batchSize;

      while (container.children.length > maxElements) {
        container.removeChild(container.lastChild);
      }

      // Adjust container height to match current content
      container.style.height = `${container.scrollHeight}px`;
    }
  }

  loadMoreData("down");

  container.addEventListener("scroll", () => {
    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 50
    ) {
      loadMoreData("down");
    } else if (container.scrollTop <= 50 && currentIndex > batchSize) {
      loadMoreData("up");
    }
  });
}

// Ensure the chapter is loaded into the DOM before scrolling
function ensureChapterInDOM(index) {
  const container = document.getElementById("chapter-content");
  if (!document.getElementById(`chapter-${index}`)) {
    const batchSize = 2; // Number of chapters to load per batch
    const start = Math.max(1, index - batchSize);
    const end = Math.min(window.chapterData.length + 1, index + batchSize);
    currentIndex = index + batchSize;
    // Clear the container and load the required batch
    container.innerHTML = "";
    window.chapterData
      .filter(
        (chapter) =>
          chapter.chapterNumber >= start && chapter.chapterNumber < end
      )
      .forEach((chapter) => {
        const chapterDiv = document.createElement("div");
        chapterDiv.classList.add("chapter");
        chapterDiv.id = `chapter-${chapter.chapterNumber}`;

        const title = document.createElement("h5");
        title.classList.add("chapter-title"); // Added the CSS class 'chapter-title'
        title.textContent = chapter.title;
        chapterDiv.appendChild(title);

        chapter.content.forEach((paragraph) => {
          const p = document.createElement("p");
          p.textContent = paragraph;
          chapterDiv.appendChild(p);
        });

        container.appendChild(chapterDiv);
      });
    // Update current index to the selected chapter
  }
}

// Ensure the chapter title is always at the top when scrolling
function scrollToChapter(index) {
  ensureChapterInDOM(index); // Ensure the chapter is loaded
  const chapterElement = document.getElementById(`chapter-${index}`);
  if (chapterElement) {
    chapterElement.scrollIntoView({ behavior: "smooth", block: "start" });

    // Cập nhật trạng thái active cho menu item tương ứng
    // Trước tiên, xóa active của tất cả
    const menuItems = document.querySelectorAll("#menu-list li");
    menuItems.forEach((item) => {
      item.classList.remove("active");
    });

    // Sau đó, set active cho menu item tương ứng bằng cách sử dụng id
    const menuItem = document.getElementById(`menu-item-${index}`);
    if (menuItem) {
      menuItem.classList.add("active");
      console.log("Set active for scrolled chapter:", index);
    }
  }
}

function hightLightActiveChapter() {
  const menuItems = document.querySelectorAll("#menu-list li");
  const chapters = document.querySelectorAll(".chapter");
  const currentChapterIndex = getVisibleChapter(chapters);

  // Xóa class active từ tất cả menu items trước
  menuItems.forEach((item) => item.classList.remove("active"));

  // Nếu tìm thấy chapter hiện tại, đánh dấu menu item tương ứng
  if (currentChapterIndex !== null && currentChapterIndex !== undefined) {
    // Tìm menu item bằng ID thay vì dựa vào index trong mảng
    const menuItem = document.getElementById(
      `menu-item-${currentChapterIndex}`
    );

    if (menuItem) {
      // Thêm class active
      menuItem.classList.add("active");
      console.log("Set active for chapter:", currentChapterIndex);
    }
  }
}

function getVisibleChapter(chapters) {
  if (!chapters || chapters.length === 0) return null;

  const container = document.getElementById("chapter-content");
  const scrollTop = container.scrollTop;
  let visibleChapterIndex = null;

  // Tìm chương đầu tiên có phần trên nằm trong vùng hiển thị
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const chapterTop = chapter.offsetTop - container.offsetTop;
    const chapterBottom = chapterTop + chapter.offsetHeight;

    // Kiểm tra nếu chapter hiện tại đang hiển thị trong viewport
    if (
      (scrollTop >= chapterTop && scrollTop < chapterBottom) ||
      (scrollTop < chapterTop &&
        scrollTop + container.clientHeight > chapterTop)
    ) {
      // Lấy chỉ số từ ID của chapter (ví dụ: chapter-2 => 2)
      visibleChapterIndex = parseInt(chapter.id.split("-")[1]);
      break; // Thoát vòng lặp khi tìm thấy chapter hiển thị
    }
  }

  // Nếu không tìm thấy chapter nào, mặc định là chapter đầu tiên (0)
  return visibleChapterIndex !== null ? visibleChapterIndex : 0;
}

// Utility function to toggle menu/modal visibility
function toggleUIElement(element, overlay, isOpen) {
  if (isOpen) {
    element.classList.add("open");
    overlay.classList.add("open");
    overlay.style.display = "block";
  } else {
    element.classList.remove("open");
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  }
}

// Utility function for handling modals
function toggleModal(modal, overlay, isOpen) {
  if (isOpen) {
    modal.classList.add("open");
    overlay.classList.add("open");
    modal.style.display = "block";
    overlay.style.display = "block";
  } else {
    modal.classList.remove("open");
    overlay.classList.remove("open");
    modal.style.display = "none";
    overlay.style.display = "none";
  }
}


// Update chapter menu links to scroll to the correct chapter
function populateChapterMenu(chapters) {
  const menuList = document.getElementById("menu-list");

  // Xóa các mục menu hiện tại
  menuList.innerHTML = "";

  // Add chapter items
  chapters.forEach((chapter, index) => {
    const listItem = document.createElement("li");
    // Đặt id cho listItem để dễ dàng tìm và cập nhật trạng thái active
    listItem.id = `menu-item-${index}`;
    listItem.setAttribute("data-index", index.toString());

    const link = document.createElement("a");
    // Tạo id duy nhất cho link dựa trên tên truyện và số chương
    const storyName = document
      .getElementById("story-name")
      .textContent.toLowerCase()
      .replace(/\s+/g, "_");
    link.id = `chapter-link-${storyName}-${index}`;
    link.href = `#chapter-${index}`; // Link to the chapter
    link.textContent = chapter.title; // Set chapter title as link text
    link.dataset.chapterIndex = index.toString(); // Lưu index vào data attribute

    link.addEventListener("click", (event) => {
      event.preventDefault(); // Prevent default anchor behavior

      // Lấy index từ data attribute
      const chapterIndex = parseInt(
        event.currentTarget.dataset.chapterIndex,
        10
      );
      console.log(`Clicking on chapter ${chapterIndex}: ${chapter.title}`);

      // Xóa tất cả các class active trước
      const allItems = document.querySelectorAll("#menu-list li");
      allItems.forEach((item) => item.classList.remove("active"));

      // Thêm class active cho mục hiện tại
      listItem.classList.add("active");

      scrollToChapter(chapterIndex); // Scroll to the selected chapter

      const chapterMenu = document.getElementById("chapter-menu");
      const menuOverlay = document.getElementById("menu-overlay");

      // Close menu
      chapterMenu.classList.remove("open");
      menuOverlay.classList.remove("open");

      // Hide overlay after animation
      setTimeout(() => {
        menuOverlay.style.display = "none";
      }, 300);
    });

    listItem.appendChild(link);
    menuList.appendChild(listItem);
  });
}

// Ensure the file input change event is handled correctly
const menuUploadBtn = document.getElementById("menu-upload-btn");
if (menuUploadBtn) {
  menuUploadBtn.addEventListener("click", function () {
    console.log("Menu upload button clicked");

    // Close chapter menu first
    const chapterMenu = document.getElementById("chapter-menu");
    const menuOverlay = document.getElementById("menu-overlay");
    chapterMenu.classList.remove("open");
    menuOverlay.classList.remove("open");

    // Trigger file input after menu is closed
    setTimeout(() => {
      menuOverlay.style.display = "none";

      // Ensure file input exists
      let fileInput = document.getElementById("file-input");
      if (!fileInput) {
        fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.id = "file-input";
        fileInput.accept = ".txt,.TXT";
        fileInput.style.display = "none";
        document.body.appendChild(fileInput);
        console.log("Created new file input element and added to DOM");
      }

      // Reset value to allow re-uploading the same file
      fileInput.value = "";

      // Ensure change event listener is attached
      if (!fileInput._hasChangeListener) {
        fileInput.addEventListener("change", function (event) {
          console.log("File input change event triggered");
          const file = event.target.files[0];
          if (file) {
            console.log("File selected:", file.name);
            processChapterData(file);
          } else {
            console.error("No file selected");
          }
        });
        fileInput._hasChangeListener = true;
        console.log("Change event listener added to file input");
      }

      // Trigger file input click
      fileInput.click();
    }, 300);
  });
} else {
  console.error("Menu upload button not found");
}

document
  .getElementById("menu-url-btn")
  .addEventListener("click", function (event) {
    // Close chapter menu
    const chapterMenu = document.getElementById("chapter-menu");
    const menuOverlay = document.getElementById("menu-overlay");
    chapterMenu.classList.remove("open");
    menuOverlay.classList.remove("open");

    // Hide overlay after animation completes
    setTimeout(() => {
      menuOverlay.style.display = "none";
    }, 300);

    // Here you can add code to open a URL input dialog or similar functionality
    // For now, we'll just use a simple prompt
    const url = prompt("Nhập URL để tải nội dung:", "");
    if (url) {
      // Add your URL fetch logic here
      console.log("Fetching from URL:", url);
      // Example: fetchFromUrl(url);
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  console.log("Page loaded, ready for story upload");

  // Thêm scroll event listener cho chapter-content để cập nhật trạng thái active
  const chapterContent = document.getElementById("chapter-content");
  chapterContent.addEventListener("scroll", function () {
    // Lưu vị trí cuộn
    saveScrollPosition();

    // Cập nhật trạng thái active cho menu
    hightLightActiveChapter();
  });
});

// Hàm áp dụng các cài đặt đã lưu cho truyện hiện tại
function applyStoredSettings() {
  const storeName = document
    .getElementById("story-name")
    .textContent.toLowerCase()
    .replace(/\s+/g, "_");
  console.log("Applying stored settings for story:", storeName);

  // Áp dụng font family
  const savedFontFamily = loadFromLocalStorage("fontFamily");
  if (savedFontFamily) {
    const fontFamilySelect = document.getElementById("font-family");
    const chapterContent = document.getElementById("chapter-content");

    // Cập nhật select box
    if (fontFamilySelect) {
      fontFamilySelect.value = savedFontFamily;
    }

    // Áp dụng font cho nội dung
    if (chapterContent) {
      chapterContent.style.fontFamily = savedFontFamily;
      console.log("Applied font family:", savedFontFamily);
    }
  }

  // Áp dụng font size
  const savedFontSize = loadFromLocalStorage("fontSize");
  if (savedFontSize) {
    const fontSizeDisplay = document.getElementById("font-size-display");
    const chapterContent = document.getElementById("chapter-content");

    // Cập nhật hiển thị
    if (fontSizeDisplay) {
      fontSizeDisplay.textContent = savedFontSize;
    }

    // Áp dụng kích thước font cho nội dung
    if (chapterContent) {
      chapterContent.style.fontSize = savedFontSize + "px";
      console.log("Applied font size:", savedFontSize);
    }
  }

  // Load regex replacements
  const savedRegexReplacements = loadFromLocalStorage("regexReplacements");
  const regexReplaceList = document.getElementById("regex-replace-list");
  if (savedRegexReplacements && Array.isArray(savedRegexReplacements)) {
    // Xóa các mục hiện tại
    regexReplaceList.innerHTML = "";

    // Thêm các regex đã lưu (đảo ngược thứ tự để duy trì thứ tự ban đầu)
    for (let i = savedRegexReplacements.length - 1; i >= 0; i--) {
      const item = savedRegexReplacements[i];
      const listItem = document.createElement("li");

      // Tạo input match
      const matchInput = document.createElement("input");
      matchInput.type = "text";
      matchInput.value = item.match;
      matchInput.readOnly = true;

      // Tạo input replace
      const replaceInput = document.createElement("input");
      replaceInput.type = "text";
      replaceInput.value = item.replace;
      replaceInput.readOnly = true;

      // Tạo nút xóa
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "×";
      deleteButton.addEventListener("click", function () {
        regexReplaceList.removeChild(listItem);
        updateRegexCount(); // Cập nhật số lượng sau khi xóa
      });

      // Thêm các phần tử vào list item
      listItem.appendChild(matchInput);
      listItem.appendChild(replaceInput);
      listItem.appendChild(deleteButton);

      // Luôn thêm mục vào đầu danh sách
      regexReplaceList.insertBefore(listItem, regexReplaceList.firstChild);
    }

    // Cập nhật số lượng regex
    updateRegexCount();
    console.log("Applied regex replacements:", savedRegexReplacements.length);
  } else {
    // Nếu không có thì clear cache trong regex-replace-list
    regexReplaceList.innerHTML = "";
    updateRegexCount();
  }
}

// Load stored regexReplacements from localStorage
function loadRegexReplacements() {
  const regexReplacements = localStorage.getItem("regexReplacements");
  if (regexReplacements) {
    try {
      return JSON.parse(regexReplacements);
    } catch (error) {
      console.error("Error parsing regex replacements:", error);
      return [];
    }
  }
  return [];
}

// Apply regex replacements after loading content
function processTextWithRegexReplacements(text) {
  const regexReplacements = loadRegexReplacements();
  let processedText = text;
  
  regexReplacements.forEach(item => {
    try {
      const regex = new RegExp(item.match, "g");
      processedText = processedText.replace(regex, item.replace);
    } catch (error) {
      console.error("Invalid regex pattern:", item.match, error);
    }
  });
  
  return processedText;
}

  // Function to update regex count
  function updateRegexCount() {
    const regexCountElement = document.getElementById("regex-count");
    const count = regexReplaceList.children.length;
    if (regexCountElement) {
      regexCountElement.textContent = `(${count})`;
    }
  }
// Call applyStoredSettings on page load
applyStoredSettings();

