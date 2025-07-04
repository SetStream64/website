document.addEventListener("DOMContentLoaded", function () {
  const navButtons = document.querySelectorAll(".nav-button");
  const sections = document.querySelectorAll(
    "#home, #portfolio, #connect, #contact",
  );

  let autoScrollTriggered = false;
  let lastScrollY = 0;

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

    // Check if we should trigger auto-scroll
    if (
      !autoScrollTriggered &&
      currentScrollY > lastScrollY &&
      currentScrollY > 50 &&
      currentScrollY < window.innerHeight * 0.3
    ) {
      autoScrollTriggered = true;

      // Smooth scroll to portfolio section
      const portfolioSection = document.getElementById("portfolio");
      if (portfolioSection) {
        portfolioSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }

    lastScrollY = currentScrollY;
    updateActiveNavButton();
  }

  // Update on scroll
  window.addEventListener("scroll", handleScroll);

  // Update on load
  updateActiveNavButton();
});
