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

    const lineSentence = loadFromLocalStorage("linesPerSentence");
    const chapters = splitIntoChapters(content, (lineSentence ?? 2)); // Split content into chapters
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
  const storeName = document
    .getElementById("story-name")
    .textContent.toLowerCase()
    .replace(/\s+/g, "_");
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
  console.log({ storeName });
  const data = localStorage.getItem(storeName);
  console.log({ storeName, data });
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

// Ensure the current chapter is highlighted when the menu is opened
// document.getElementById("show-menu").addEventListener("click", () => {
//   const chapterMenu = document.getElementById("chapter-menu");
//   const menuOverlay = document.getElementById("menu-overlay");
//   const isOpen = !chapterMenu.classList.contains("open");

//   toggleUIElement(chapterMenu, menuOverlay, isOpen);

//   if (isOpen) {
//     // Force reflow to ensure animation works properly
//     void chapterMenu.offsetWidth;

//     // Highlight active chapter dựa trên vị trí cuộn hiện tại
//     hightLightActiveChapter();
//   }
// });

// Close menu when clicking on close button
// document.getElementById("close-menu").addEventListener("click", () => {
//   const chapterMenu = document.getElementById("chapter-menu");
//   const menuOverlay = document.getElementById("menu-overlay");
//   toggleUIElement(chapterMenu, menuOverlay, false);
// });

// Close menu when clicking on overlay
document.getElementById("menu-overlay").addEventListener("click", () => {
  const chapterMenu = document.getElementById("chapter-menu");
  const menuOverlay = document.getElementById("menu-overlay");
  toggleUIElement(chapterMenu, menuOverlay, false);
});

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

// Ensure the menuUploadBtn variable is declared only once
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

      // Create and trigger a new click event on file input
      const fileInput = document.getElementById("file-input");
      if (fileInput) {
        fileInput.value = ""; // Reset value to allow selecting the same file again
        fileInput.click();
      } else {
        console.error("File input element not found");
      }
    }, 300);
  });
} else {
  console.error("Menu upload button not found");
}

// document
//   .getElementById("menu-url-btn")
//   .addEventListener("click", function (event) {
//     // Close chapter menu
//     const chapterMenu = document.getElementById("chapter-menu");
//     const menuOverlay = document.getElementById("menu-overlay");
//     chapterMenu.classList.remove("open");
//     menuOverlay.classList.remove("open");

//     // Hide overlay after animation completes
//     setTimeout(() => {
//       menuOverlay.style.display = "none";
//     }, 300);

//     // Here you can add code to open a URL input dialog or similar functionality
//     // For now, we'll just use a simple prompt
//     const url = prompt("Nhập URL để tải nội dung:", "");
//     if (url) {
//       // Add your URL fetch logic here
//       console.log("Fetching from URL:", url);
//       // Example: fetchFromUrl(url);
//     }
//   });

// Ensure the file input change event is handled correctly
const fileInput = document.getElementById("file-input");
if (fileInput) {
  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      console.log("File selected:", file.name);
      processChapterData(file);
    } else {
      console.error("No file selected");
    }
  });
} else {
  console.error("File input element not found");
}

// document
//   .getElementById("menu-setting-btn")
//   .addEventListener("click", function () {
//     const settingsModal = document.getElementById("settings-modal");
//     const modalOverlay = document.getElementById("modal-overlay");
//     const chapterMenu = document.getElementById("chapter-menu");
//     const menuOverlay = document.getElementById("menu-overlay");

//     // Close menu first
//     if (chapterMenu && menuOverlay) {
//       toggleUIElement(chapterMenu, menuOverlay, false);
//     }

//     // Open settings modal
//     if (settingsModal && modalOverlay) {
//       toggleModal(settingsModal, modalOverlay, true);
//     }
//   });

document
  .getElementById("close-settings")
  .addEventListener("click", function () {
    const settingsModal = document.getElementById("settings-modal");
    const modalOverlay = document.getElementById("modal-overlay");
    toggleModal(settingsModal, modalOverlay, false);
  });

document.getElementById("save-settings").addEventListener("click", function () {
  // Collect settings
  const settings = {
    fontFamily: document.getElementById("font-family").value,
    fontSize: document.getElementById("font-size-display").textContent,
    linesPerSentence: document.getElementById("lines-per-sentence-display")
      .textContent,
  };

  // Save all settings to local storage
  Object.entries(settings).forEach(([key, value]) => {
    saveToLocalStorage(key, value);
  });

  // Apply settings to chapter content
  const chapterContent = document.getElementById("chapter-content");
  if (chapterContent) {
    chapterContent.style.fontFamily = settings.fontFamily;
    chapterContent.style.fontSize = settings.fontSize + "px";
  }

  // Get regex replacements
  const regexReplacements = Array.from(
    document.querySelectorAll("#regex-replace-list li")
  )
    .map((item) => {
      const inputs = item.querySelectorAll("input");
      return inputs.length >= 2
        ? { match: inputs[0].value, replace: inputs[1].value }
        : null;
    })
    .filter(Boolean);

  saveToLocalStorage("regexReplacements", regexReplacements);
  console.log("All settings saved!");

  // Close the settings modal
  const settingsModal = document.getElementById("settings-modal");
  const modalOverlay = document.getElementById("modal-overlay");
  toggleModal(settingsModal, modalOverlay, false);
});

document
  .getElementById("font-family")
  .addEventListener("change", function (event) {
    const selectedFont = event.target.value;
    console.log("Font family changed to:", selectedFont);

    // Apply the font family change to the chapter content
    const chapterContent = document.getElementById("chapter-content");
    if (chapterContent) {
      chapterContent.style.fontFamily = selectedFont;
      console.log("Applied font family:", selectedFont);
    }

    // Store the font family preference in local storage
    saveToLocalStorage("fontFamily", selectedFont);
  });

// Consolidated function to handle font size changes
function adjustFontSize(isIncrease) {
  const fontSizeDisplay = document.getElementById("font-size-display");
  let fontSize = parseInt(fontSizeDisplay.textContent);

  if (isIncrease) {
    fontSize += 1;
  } else if (fontSize > 10) {
    // Prevent font from becoming too small
    fontSize -= 1;
  } else {
    return; // Don't proceed if font would be too small
  }

  fontSizeDisplay.textContent = fontSize;

  // Apply the font size change to the chapter content
  const chapterContent = document.getElementById("chapter-content");
  if (chapterContent) {
    chapterContent.style.fontSize = fontSize + "px";
  }

  console.log(
    `Font size ${isIncrease ? "increased" : "decreased"} to:`,
    fontSize
  );
}

// Add event listeners for font size controls
document
  .getElementById("increase-font-size")
  .addEventListener("click", () => adjustFontSize(true));
document
  .getElementById("decrease-font-size")
  .addEventListener("click", () => adjustFontSize(false));

// Consolidated function to handle lines per sentence changes
function adjustLinesPerSentence(isIncrease) {
  const linesPerSentenceDisplay = document.getElementById(
    "lines-per-sentence-display"
  );
  let linesPerSentence = parseInt(linesPerSentenceDisplay.textContent);

  if (isIncrease) {
    linesPerSentence += 1;
  } else if (linesPerSentence > 1) {
    // Prevent lines from becoming less than 1
    linesPerSentence -= 1;
  } else {
    return; // Don't proceed if value would be invalid
  }

  linesPerSentenceDisplay.textContent = linesPerSentence;
  console.log(
    `Lines per sentence ${isIncrease ? "increased" : "decreased"} to:`,
    linesPerSentence
  );
}

// Add event listeners for lines per sentence controls
document
  .getElementById("increase-lines-per-sentence")
  .addEventListener("click", () => adjustLinesPerSentence(true));
document
  .getElementById("decrease-lines-per-sentence")
  .addEventListener("click", () => adjustLinesPerSentence(false));

// Add event listener for regex add button
document
  .getElementById("add-regex-replace")
  .addEventListener("click", function () {
    const regexMatch = document.getElementById("regex-match").value;
    const regexReplace = document.getElementById("regex-replace").value;

    if (regexMatch && regexReplace) {
      // Create a new list item for the regex replacement
      const regexReplaceList = document.getElementById("regex-replace-list");
      const listItem = document.createElement("li");

      // Add the regex match and replace inputs
      const matchInput = document.createElement("input");
      matchInput.type = "text";
      matchInput.value = regexMatch;
      matchInput.readOnly = true;

      const replaceInput = document.createElement("input");
      replaceInput.type = "text";
      replaceInput.value = regexReplace;
      replaceInput.readOnly = true;

      // Add a delete button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "×";
      deleteButton.addEventListener("click", function () {
        regexReplaceList.removeChild(listItem);
        updateRegexCount(); // Update count after removal
      });

      // Add the elements to the list item
      listItem.appendChild(matchInput);
      listItem.appendChild(replaceInput);
      listItem.appendChild(deleteButton);

      // Always add the list item to the TOP of the regex replace list
      regexReplaceList.insertBefore(listItem, regexReplaceList.firstChild);

      // Clear the inputs
      document.getElementById("regex-match").value = "";
      document.getElementById("regex-replace").value = "";

      console.log("Regex replacement added:", regexMatch, "->", regexReplace);

      // Update the regex count display
      updateRegexCount();
    }
  });

// Function to update the regex count display
function updateRegexCount() {
  const regexItems = document.querySelectorAll("#regex-replace-list li");
  const countElement = document.getElementById("regex-count");
  if (countElement) {
    countElement.textContent = `(${regexItems.length})`;
  }
}

// Add scroll event listener to save scroll position
document
  .getElementById("chapter-content")
  .addEventListener("scroll", function () {
    saveScrollPosition();
  });

// Set up basic UI when the page loads
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

// Float Menu Toggle Functionality
const floatMenuToggle = document.getElementById("float-menu-toggle");
const floatMenuContainer = document.querySelector(".float-menu-container");
const menuButtons = document.querySelectorAll(".float-menu-button");

// Ngăn chặn hiệu ứng mặc định khi click
floatMenuToggle.addEventListener("mousedown", (e) => {
  e.preventDefault();
});


floatMenuToggle.addEventListener("click", () => {
  floatMenuContainer.classList.toggle("active");
  floatMenuToggle.classList.toggle("active");
});

// Button click handlers
document.getElementById("toggle-chapters-btn").addEventListener("click", () => {
  console.log("Toggle chapters menu");
  // Add your code to toggle chapters menu
  // Menu sẽ không đóng khi nhấn vào nút này
  const chapterMenu = document.getElementById("chapter-menu");
  const menuOverlay = document.getElementById("menu-overlay");
  const isOpen = !chapterMenu.classList.contains("open");

  toggleUIElement(chapterMenu, menuOverlay, isOpen);

  if (isOpen) {
    // Force reflow to ensure animation works properly
    void chapterMenu.offsetWidth;

    // Highlight active chapter dựa trên vị trí cuộn hiện tại
    hightLightActiveChapter();
  }
});

document.getElementById("open-settings-btn").addEventListener("click", () => {
  console.log("Open settings");
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
  // Add your code to open settings modal
  // Menu sẽ không đóng khi nhấn vào nút này
});

document.getElementById("upload-file-btn").addEventListener("click", () => {
  console.log("Upload file");
  // Add your code to trigger file upload
  // Menu sẽ không đóng khi nhấn vào nút 
  // Close chapter menu first
    const chapterMenu = document.getElementById("chapter-menu");
    const menuOverlay = document.getElementById("menu-overlay");
    chapterMenu.classList.remove("open");
    menuOverlay.classList.remove("open");

    // Trigger file input after menu is closed
    setTimeout(() => {
      menuOverlay.style.display = "none";

      // Create and trigger a new click event on file input
      const fileInput = document.getElementById("file-input");
      if (fileInput) {
        fileInput.value = ""; // Reset value to allow selecting the same file again
        fileInput.click();
      } else {
        console.error("File input element not found");
      }
    }, 300);
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

// Call applyStoredSettings on page load
applyStoredSettings();
