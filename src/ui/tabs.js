import { TAB_TITLES } from "../config.js";
import { getSyncStorage, setSyncStorage } from "../utils/storage.js";

export function createTabs() {
  const tabsContainer = document.createElement("div");
  tabsContainer.className = "rhymey-tabs";

  TAB_TITLES.forEach((title, index) => {
    const tab = document.createElement("div");
    tab.className = "rhymey-tab";
    tab.dataset.index = index;
    tab.textContent = title;
    tabsContainer.appendChild(tab);
  });

  return tabsContainer.outerHTML;
}

export function initTabSwitching() {
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("rhymey-tab")) {
      const index = Number.parseInt(event.target.dataset.index);
      const allTabs = document.querySelectorAll(".rhymey-tab");
      const allContents = document.querySelectorAll(".rhymey-tab-content");

      for (const tab of allTabs) {
        tab.classList.remove("active");
      }

      for (const content of allContents) {
        content.classList.remove("active");
      }

      event.target.classList.add("active");
      allContents[index].classList.add("active");

      saveSelectedTabIndex(index);
    }
  });
}

export function saveSelectedTabIndex(index) {
  setSyncStorage({ selectedTabIndex: index });
}

export async function restoreSelectedTab() {
  const { selectedTabIndex = 0 } = await getSyncStorage(["selectedTabIndex"]);

  const tab = document.querySelector(
    `.rhymey-tab[data-index="${selectedTabIndex}"]`,
  );
  const content = document.querySelectorAll(".rhymey-tab-content")[
    selectedTabIndex
  ];

  if (tab && content) {
    tab.classList.add("active");
    content.classList.add("active");
  } else {
    const firstTab = document.querySelector('.rhymey-tab[data-index="0"]');
    const firstContent = document.querySelectorAll(".rhymey-tab-content")[0];

    if (firstTab && firstContent) {
      firstTab.classList.add("active");
      firstContent.classList.add("active");
    }
  }
}
