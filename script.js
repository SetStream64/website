document.addEventListener("DOMContentLoaded", function () {
  const navButtons = document.querySelectorAll(".nav-button");
  const sections = document.querySelectorAll(
    "#home, #portfolio, #connect, #contact",
  );

  let autoScrollTriggered = false;
  let lastScrollY = 0;
  let scrollThreshold = 100; // Threshold for scroll detection
  let scrollTimeoutId = null;

  // Scroll to top when page is refreshed
  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  };

  // Ensure we're at the top when the page loads
  window.addEventListener("load", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Set up section scrolling helpers
    setupSectionScrollHelpers();
  });

  // Set up scroll helpers for the home section only
  function setupSectionScrollHelpers() {
    const sections = document.querySelectorAll("#home");

    sections.forEach((section) => {
      // Create scroll helper if it doesn't exist
      let helper = section.querySelector(".section-scroll-helper");

      if (!helper) {
        helper = document.createElement("div");
        helper.className = "section-scroll-helper";
        helper.innerHTML = '<div class="section-scroll-arrow"></div>';
        section.appendChild(helper);

        // Add click event
        helper.addEventListener("click", function () {
          const portfolioSection = document.getElementById("portfolio");
          if (portfolioSection) {
            portfolioSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        });
      }
    });
  }

  // Utility function to sanitize text against XSS attacks
  function sanitizeText(text) {
    if (!text) return "";
    const element = document.createElement("div");
    element.textContent = text;
    return element.innerHTML;
  }

  // URL sanitization function
  function sanitizeURL(url) {
    if (!url) return "#";
    // Only allow http and https protocols
    if (url.startsWith("http://") || url.startsWith("https://")) {
      // Create an anchor element to use the browser's URL parsing
      const anchor = document.createElement("a");
      anchor.href = url;
      // Allow trusted domains
      const trustedDomains = [
        "github.com",
        "tiktok.com",
        "x.com",
        "instagram.com",
        "threads.com",
        "youtube.com",
        "twitch.tv",
        "reddit.com",
        "osu.ppy.sh",
      ];
      if (trustedDomains.some((domain) => anchor.hostname.endsWith(domain))) {
        return url;
      }
    }
    return "#"; // Return a safe default if URL is invalid
  }

  // GitHub portfolio functionality
  const username = "setstream64";
  const portfolioContainer = document.querySelector(".portfolio-container");
  const maxRepos = 3; // Maximum number of repositories to display

  // Function to fetch GitHub repositories
  async function fetchGitHubRepos() {
    try {
      // Prevent potential script injection by validating username
      const validUsername = username.replace(/[^\w-]/g, "");
      const response = await fetch(
        `https://api.github.com/users/${validUsername}/repos?sort=updated&per_page=100`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const repos = await response.json();
      // Filter out forked repositories and the SetStream64 repo (GitHub bio)
      return repos.filter((repo) => !repo.fork && repo.name !== "SetStream64");
    } catch (error) {
      console.error("Error fetching GitHub repositories:", error);
      const errorMsg = document.createElement("p");
      errorMsg.textContent =
        "Failed to load repositories. Please try again later.";
      portfolioContainer.innerHTML = "";
      portfolioContainer.appendChild(errorMsg);
      // Add console.error for debugging but don't expose error details to users
      console.error("Error details:", error);
      return [];
    }
  }

  // Function to fetch commit count for a repository
  async function fetchCommitCount(repo) {
    try {
      // Validate repo name to prevent injection
      const validRepoName = repo.name.replace(/[^\w-.]/g, "");
      const response = await fetch(
        `https://api.github.com/repos/${username}/${validRepoName}/commits?per_page=1`,
        { headers: { Accept: "application/vnd.github.v3+json" } },
      );
      const linkHeader = response.headers.get("Link");

      if (linkHeader) {
        // Extract commit count from Link header
        const match = linkHeader.match(/page=(\d+)>; rel="last"/);
        if (match) {
          return parseInt(match[1]);
        }
      }

      // If no Link header, count from all pages
      const commits = await response.json();
      return commits.length;
    } catch (error) {
      console.error(`Error fetching commits for ${repo.name}:`, error);
      return 0;
    }
  }

  // Function to render repositories
  async function renderRepos(repos) {
    if (repos.length === 0) {
      const noReposMsg = document.createElement("p");
      noReposMsg.textContent = "No repositories found.";
      portfolioContainer.innerHTML = "";
      portfolioContainer.appendChild(noReposMsg);
      return;
    }

    // Sort repositories by stars initially (for a default order)
    repos.sort((a, b) => b.stargazers_count - a.stargazers_count);

    // Limit to max number of repos
    const displayRepos = repos.slice(0, maxRepos);

    // Fetch commit counts for each repository
    portfolioContainer.innerHTML = "";
    const loadingMsg = document.createElement("p");
    loadingMsg.className = "loading-text";
    loadingMsg.textContent = "Analyzing repositories...";
    portfolioContainer.appendChild(loadingMsg);

    try {
      // Add commit counts to repos
      for (let i = 0; i < displayRepos.length; i++) {
        displayRepos[i].commitCount = await fetchCommitCount(displayRepos[i]);
      }

      // Find the repo with most commits
      let maxCommitRepo = displayRepos[0];
      displayRepos.forEach((repo) => {
        if (repo.commitCount > maxCommitRepo.commitCount) {
          maxCommitRepo = repo;
        }
      });

      // Reorganize repos to have most commits in the middle
      let reordered = [...displayRepos];
      const maxCommitIndex = reordered.findIndex(
        (repo) => repo === maxCommitRepo,
      );

      // Only reorder if necessary
      if (maxCommitIndex !== 1) {
        // 1 is the middle index of 3 items (0-based)
        // Remove the max commit repo
        reordered.splice(maxCommitIndex, 1);
        // Insert it in the middle
        reordered.splice(1, 0, maxCommitRepo);
      }

      // Clear the container
      portfolioContainer.innerHTML = "";

      // Create repository elements safely
      reordered.forEach((repo, index) => {
        const isFeatured = index === 1; // Middle position (0-based index)

        // Create main container
        const itemDiv = document.createElement("div");
        itemDiv.className = `portfolio-item ${isFeatured ? "featured" : ""}`;

        // Create and add repo name
        const nameHeading = document.createElement("h3");
        nameHeading.className = "repo-name";
        nameHeading.textContent = repo.name;
        itemDiv.appendChild(nameHeading);

        // Create and add description
        const descPara = document.createElement("p");
        descPara.className = "repo-description";
        descPara.textContent = repo.description || "No description provided";
        itemDiv.appendChild(descPara);

        // Create stats container
        const statsDiv = document.createElement("div");
        statsDiv.className = "repo-stats";

        // Star count
        const starSpan = document.createElement("span");
        starSpan.className = "repo-stat";
        starSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
        </svg>`;
        const starText = document.createTextNode(` ${repo.stargazers_count}`);
        starSpan.appendChild(starText);
        statsDiv.appendChild(starSpan);

        // Fork count
        const forkSpan = document.createElement("span");
        forkSpan.className = "repo-stat";
        forkSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
        </svg>`;
        const forkText = document.createTextNode(` ${repo.forks_count}`);
        forkSpan.appendChild(forkText);
        statsDiv.appendChild(forkSpan);

        // Commit count
        const commitSpan = document.createElement("span");
        commitSpan.className = "repo-stat";
        commitSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"/>
        </svg>`;
        const commitText = document.createTextNode(` ${repo.commitCount}`);
        commitSpan.appendChild(commitText);
        statsDiv.appendChild(commitSpan);

        itemDiv.appendChild(statsDiv);

        // Create and add link
        const repoLink = document.createElement("a");
        repoLink.className = "repo-link";
        repoLink.textContent = "View Project";
        repoLink.href = sanitizeURL(repo.html_url);
        repoLink.target = "_blank";
        repoLink.rel = "noopener noreferrer";
        itemDiv.appendChild(repoLink);

        // Add the complete item to the container
        portfolioContainer.appendChild(itemDiv);
      });
    } catch (error) {
      console.error("Error processing repositories:", error);
      portfolioContainer.innerHTML = "";
      const errorMsg = document.createElement("p");
      errorMsg.textContent =
        "Failed to process repositories. Please try again later.";
      portfolioContainer.appendChild(errorMsg);
      // Add console.error for debugging but don't expose error details to users
      console.error("Error details:", error);
    }
  }

  // Function to sanitize and handle social links
  function secureSocialLinks() {
    const socialLinks = document.querySelectorAll(".social-link");

    socialLinks.forEach((link) => {
      // Get the href attribute
      const url = link.getAttribute("href");

      // Sanitize the URL
      const safeURL = sanitizeURL(url);

      // Set the sanitized URL back to the element
      link.setAttribute("href", safeURL);

      // Add click handler for additional security
      link.addEventListener("click", function (e) {
        // If URL was sanitized to '#', prevent navigation
        if (safeURL === "#") {
          e.preventDefault();
          console.warn("Potentially unsafe URL was blocked");
        }
      });
    });
  }

  // Load repositories
  async function loadPortfolio() {
    const repos = await fetchGitHubRepos();
    await renderRepos(repos);
  }

  // Call the function to load the portfolio
  loadPortfolio();

  function updateActiveNavButton() {
    let currentSection = "home";

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;

      // Check if section is in viewport (accounting for header height)
      if (sectionTop <= 100 && sectionTop + sectionHeight > 100) {
        currentSection = section.id;
      }
    });

    // Update active button
    navButtons.forEach((button) => {
      const href = button.getAttribute("href").substring(1); // Remove #
      if (href === currentSection) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  function handleScroll() {
    const currentScrollY = window.scrollY;
    const deltaY = currentScrollY - lastScrollY;

    // Check if user is near the end of a section - for home and portfolio sections
    const homeSection = document.querySelector("#home");
    const portfolioSection = document.querySelector("#portfolio");
    let nearSectionEnd = false;
    let nextSection = null;

    // Check home section first
    if (homeSection) {
      const rect = homeSection.getBoundingClientRect();
      const sectionBottom = rect.bottom;
      const viewportHeight = window.innerHeight;

      // If we're near the bottom of the home section and scrolling down
      if (
        sectionBottom > 0 &&
        sectionBottom < viewportHeight * 0.8 &&
        deltaY > 0
      ) {
        nearSectionEnd = true;
        nextSection = document.querySelector("#portfolio");
      }
    }

    // Then check portfolio section
    if (!nearSectionEnd && portfolioSection) {
      const rect = portfolioSection.getBoundingClientRect();
      const sectionBottom = rect.bottom;
      const viewportHeight = window.innerHeight;

      // If we're near the bottom of the portfolio section and scrolling down
      if (
        sectionBottom > 0 &&
        sectionBottom < viewportHeight * 0.8 &&
        deltaY > 0
      ) {
        nearSectionEnd = true;
        nextSection = document.querySelector("#connect");
      }
    }

    // Auto-scroll to portfolio section when near the end of home section
    if (nearSectionEnd && nextSection && deltaY > 0) {
      // Accumulate scroll amount
      scrollThreshold -= deltaY;

      // Clear any existing timeout
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }

      // If threshold is reached, scroll to next section
      if (scrollThreshold <= 0) {
        nextSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Reset threshold after scrolling
        scrollThreshold = 100;
      } else {
        // Reset threshold after 300ms of no scrolling
        scrollTimeoutId = setTimeout(() => {
          scrollThreshold = 100;
        }, 300);
      }
    }

    // Original auto-scroll for home to portfolio
    if (
      !autoScrollTriggered &&
      deltaY > 0 && // Only trigger on downward scrolls
      currentScrollY > 0 && // User has started scrolling
      currentScrollY < window.innerHeight * 0.5 // Still in first half of the home screen
    ) {
      // Clear any existing timeout
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }

      // Set threshold for accumulated scroll
      scrollThreshold -= deltaY;

      // If threshold is reached, scroll to portfolio
      if (scrollThreshold <= 0) {
        autoScrollTriggered = true;

        // Smooth scroll to portfolio section
        const portfolioSection = document.getElementById("portfolio");
        if (portfolioSection) {
          portfolioSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } else {
        // Reset threshold after 300ms of no scrolling
        scrollTimeoutId = setTimeout(() => {
          scrollThreshold = 100;
        }, 300);
      }
    }

    lastScrollY = currentScrollY;
    updateActiveNavButton();
  }

  // Update on scroll with throttling for better performance
  let scrollTimer;
  window.addEventListener("scroll", function () {
    if (!scrollTimer) {
      scrollTimer = setTimeout(function () {
        handleScroll();
        scrollTimer = null;
      }, 10); // Small delay for better performance
    }
  });

  // Remove the original scroll arrow/indicator since we now use section-scroll-helper

  // Implement smooth scrolling for all section navigation
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Update URL without page jump
        history.pushState(null, null, targetId);
      }
    });
  });

  // Update on load
  updateActiveNavButton();

  // Reset scroll threshold when page is reloaded
  scrollThreshold = 100;

  // Force scroll to top on page load
  window.scrollTo(0, 0);

  // Secure all social links
  secureSocialLinks();
});
