/* eslint-disable sonarjs/no-collapsible-if */
/* eslint-disable no-undef */
/* eslint-disable no-lonely-if */
/* eslint-disable func-names */
/* This zoomOut() function is needed when windows machines are set to 1.25 DPI or 125% display setting.
Chrome interprets this high DPI as 125% zoom and scales the app to 125% zoomed in
even though user would see the default 100% zoom setting in the browser.
Though browser sniffing is not recommended, the only programmatic work around to resolve this issue is to
detect the user agent to check if it is Chrome and set the zoom to 85% (set in global.css) which fixes display issue in Chrome..
With this work around, users will still be able to zoom in and zoom out as usual. This function has been moved to execute
right below body tag in layout.pug file to fix content jumping in chrome. In Chrome, content zooms in first and then zooms out to 85%
which makes the page appear to be jumping.
*/

const selector1 = "ul.submenu-nav";
const selector2 = "#devkit-help-content-wrapper";
const selector3 = ".devkit-parent";
const selector4 = ".devkit-child";
const selector5 = ".devkit-checkbox-group:eq(0)";
const selector6 = "#devkit-slider";
const selector7 = ".devkit-accordion-head";
const selector8 = ".devkit-accordion-body";
const selector9 = "span:first";
const selector10 = "fa-chevron-down";
const selector11 = "fa-chevron-right";
const selector12 = ".devkit-code-button";
const selector13 = "#privacy-modal";
const selector14 = ".copy-button";
const selector15 = "ul.child-menu";
const selector16 = "child-nav-open";
const selector17 = "li.devkit-inner-nav-link.right";
const event1 = "keypress click";
const ariaattr1 = "aria-selected";
const ariaattr2 = "aria-hidden";

const openMobileNav = function () {
  $(".devkit-mobile-menu").bind("click", function (e) {
    e.stopPropagation();
    $(".devkit-menu-overlay, nav.devkit-mobile-menu-items").addClass("active");
  });
  $(".devkit-mobile-menu").keydown(function (e) {
    if (e.key === "Enter") {
      $(this).trigger("click");
    }
  });
};

const openMobileSubNav = function () {
  $("nav.devkit-mobile-menu-items ul.devkit-nav-links li.devkit-nav-link").bind(
    "click",
    function (e) {
      e.stopPropagation();
      $(this)
        .children(selector1)
        .slideToggle("fast", function () {
          /* empty, there is nothing to return */
        });
    }
  );
  $(
    "nav.devkit-mobile-menu-items ul.devkit-nav-links li.devkit-nav-link"
  ).keydown(function (f) {
    if (f.key === "Enter") {
      $(this).trigger("click");
    }
  });
};

const openMultiSelectDropdown = function () {
  $(
    "div.devkit-multi-select-form-wrapper div.devkit-label-wrapper div.devkit-multi-select-dropdown, fieldset.multi-select-fieldset-wrapper"
  ).on(event1, function (e) {
    e.stopPropagation();
    $("div.devkit-multi-select-options-wrapper").slideToggle(
      "fast",
      function () {
        /* empty, there is nothing to return */
      }
    );
  });
};

const openGroupMultiSelectDropdown = function () {
  $(
    "div.devkit-group-multi-select-form-wrapper div.devkit-label-wrapper div.devkit-group-select-dropdown, fieldset.group-select-fieldset-wrapper"
  ).on(event1, function (e) {
    e.stopPropagation();
    $("div.devkit-group-select-options-wrapper").slideToggle(
      "fast",
      function () {
        /* empty, there is nothing to return */
      }
    );
  });
};

const openLeftSubNav = function () {
  $(".devkit-left-nav-wrapper ul.devkit-nav-links li.devkit-nav-link").bind(
    "click",
    function (z) {
      z.stopPropagation();
      $(this)
        .children(selector1)
        .slideToggle("fast", function () {
          /* empty, there is nothing to return */
        });
    }
  );
};

const closeMobileNav = function () {
  $(".devkit-close-menu").bind("click", function (e) {
    e.stopPropagation();
    $(".devkit-menu-overlay, nav.devkit-mobile-menu-items").removeClass(
      "active"
    );
  });
  $(".devkit-close-menu").keydown(function (m) {
    if (m.key === "Enter") {
      $(this).trigger("click");
    }
  });
};

const openSearch = function () {
  const num = 100;
  $("#devkit-search-icon-wrapper").on(event1, function (e) {
    e.stopPropagation();
    $(selector2).hide();
    $("div.devkit-toolbar-icon").hide();
    $("#devkit-search-wrapper").show(num, "linear", function () {
      $(this).find("input").focus();
    });
  });
};

const closeSearch = function () {
  const num = 100;
  $(".devkit-close-search").on(event1, function (e) {
    e.stopPropagation();
    $("#devkit-search-wrapper").hide(num, "linear", function () {
      /* empty, there is nothing to return */
    });
    $("div.devkit-toolbar-icon").show();
  });
};

const logInToggle = function () {
  $("#devkit-signin-wrapper").on(event1, function (e) {
    e.stopPropagation();
    $(selector2).hide();
    $(this)
      .find(".devkit-tool-bar-text")
      .text(function (i, oldText) {
        return $.trim(oldText) === "Sign In" ? "Sign Out" : "Sign In";
      });
    $(".devkit-greeting-wrapper")
      .find(".devkit-greeting-user")
      .text(function (i, oldText) {
        return $.trim(oldText) === "Guest"
          ? "First.Name.ctr.Last.Name@faa.gov"
          : "Guest";
      });
    $(this).find("i").toggleClass("far fa-user fa fa-user-alt");
  });
};

const tabSelect = function () {
  $("ul.devkit-tabs li, ul.tabs li").on(event1, function (e) {
    e.stopPropagation();
    const tabId = $(this).attr("data-tab");

    $("ul.devkit-tabs li, ul.tabs li").removeClass("active");
    $(".devkit-tab-content, .tab-content").removeClass("active");

    $(this).addClass("active");
    $(`#${tabId}`).addClass("active");
  });
};

const formSelect = function () {
  $("ul.devkit-forms-tab li").on("click", function (e) {
    e.stopPropagation();
    const tabId = $(this).attr("aria-controls");
    const arrOfSelectors = [
      "button",
      "[href]",
      "input:not(:disabled)",
      "select:not(:disabled)",
      "textarea:not(:disabled)",
      'input[type="checkbox"]',
      'input[type="radio"]',
      'div[id="states-multi-select"]',
      'div[id="states-fruits-multi-select"]',
    ];
    const arrToString = arrOfSelectors.join(", ");

    // Need this to keep the last tab open when leaving the tablist.
    const lastTabId = $("ul.devkit-forms-tab li:last-child").attr("id");

    $("ul.devkit-forms-tab li").attr(ariaattr1, "false").removeClass("active");
    $(".devkit-form-content").attr(ariaattr2, "true").removeClass("active");

    $(this).attr(ariaattr1, "true").addClass("active");
    $(`#${tabId}`)
      .attr(ariaattr2, "false")
      .addClass("active")
      .find(arrToString)
      .first()
      .focus();

    const lastInputItem = $(`#${tabId}`)
      .find(
        'button, [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), input[type="checkbox"]'
      )
      .last();

    // This is needed for tabbing through form items and to the next tab.
    $(lastInputItem).on("focusout", function () {
      const currentTabId = $(this)
        .closest("div.devkit-form-content")
        .attr("aria-labelledby");
      if (currentTabId !== lastTabId) {
        $(this)
          .closest('div.devkit-form-content[aria-hidden="false"]')
          .attr(ariaattr2, "true")
          .removeClass("active");
        $(`#${currentTabId}`).attr(ariaattr1, "false").removeClass("active");
        const nextTabContent = $(`#${currentTabId}`)
          .next("li")
          .attr("aria-controls");
        $(`#${currentTabId}`)
          .next("li")
          .attr(ariaattr1, "true")
          .addClass("active")
          .focus();
        $(`#${nextTabContent}`).attr(ariaattr2, "false").addClass("active");
      }
    });
    $('input[type="radio"]').on("keydown", function () {
      const currentTabId = $(this)
        .closest("div.devkit-form-content")
        .attr("aria-labelledby");
      if (e.key === "Tab") {
        $(`#${currentTabId}`)
          .attr(ariaattr1, "true")
          .addClass("active")
          .focus();
      }
    });
  });

  // Needed for unknown click event that opens the dropdown on keypress. This will open the dropdown on click event.
  $('li[id="form6"]').on("click", function () {
    $("div.devkit-multi-select-options-wrapper").show();
  });

  // Needed for unknown click event that opens the dropdown on keypress. This will open the dropdown on click event.
  $('li[id="form7"]').on("click", function () {
    $("div.devkit-group-select-options-wrapper").show();
  });

  $("ul.devkit-forms-tab li[role='tab']").keypress(function (p) {
    if (p.key === "Enter") {
      $(this).click();
    }
  });
};

const verticalTabSelect = function () {
  $("ul.devkit-vertical-tabs li, div.vr-tab-wrapper ul.tabs li").on(
    event1,
    function (e) {
      e.stopPropagation();
      const tabId = $(this).attr("data-tab");

      $(
        "ul.devkit-vertical-tabs li, div.vr-tab-wrapper ul.tabs li"
      ).removeClass("active");
      $(
        ".devkit-vertical-content, div.vr-tab-wrapper .tab-content"
      ).removeClass("active");

      $(this).addClass("active");
      $(`#${tabId}`).addClass("active");
    }
  );
};

const checkAll = function () {
  $(".devkit-checkbox-group").each(function () {
    const $childCheckboxes = $(this).find("input.devkit-child");
    const numberChecked = $childCheckboxes.filter(":checked").length;

    if ($childCheckboxes.length === numberChecked) {
      $(this).find(selector3).prop("checked", true);
    }
  });

  $("input.devkit-child").change(function () {
    $(this)
      .closest(".devkit-checkbox-group")
      .find(selector3)
      .prop(
        "checked",
        $(this).closest(".devkit-group-children").find(".devkit-child:checked")
          .length ===
          $(this).closest(".devkit-group-children").find(selector4).length
      );
  });

  // clicking the parent checkbox should check or uncheck all child checkboxes
  $(selector3).on(event1, function () {
    $(this).parents(selector5).find(selector4).prop("checked", this.checked);
  });

  // clicking the last unchecked or checked child checkbox should check or uncheck the parent checkbox
  $(selector4).on(event1, function () {
    if (
      $(this).parents(selector5).find(selector3).attr("checked") === true &&
      this.checked === false
    ) {
      $(this).parents(selector5).find(selector3).attr("checked", false);
    }

    if (this.checked === true) {
      let flag = true;
      $(this)
        .parents(selector5)
        .find(selector4)
        .each(function () {
          if (this.checked === false) {
            flag = false;
          }
        });

      $(this).parents(selector5).find(selector3).attr("checked", flag);
    }
  });
};

// This works for both left Nav and Horizontal Nav Bar.
const setActiveNav = function () {
  let path = window.location.pathname;
  const lastPart = path.match(/[^/]*$/)[0];
  path = path.replace(/\/$/, "");
  path = decodeURIComponent(path);

  $(
    "ul.devkit-left-nav-links li a, ul.devkit-nav-links li.devkit-nav-link-nosub a, ul.devkit-nav-links li.devkit-nav-link a, ul.devkit-links li a"
  ).each(function () {
    const href = `/${$(this).attr("href")}`;
    if (
      (path.substring(0, href.length) === href) !== "undefined" ||
      $(this).attr("href") !== "undefined"
    ) {
      if (
        path.substring(0, href.length) === href ||
        $(this).attr("href") === lastPart
      ) {
        $(this).closest("li").addClass("active");
      }
    }
    if (path === "/internal" || path === "/template/internal") {
      $("li:has(a[href='guidelines-page.html'])").addClass("active");
    }
    if (path === "/public-facing" || path === "/template/public-facing") {
      $("li:has(a[href='ext-guidelines-page.html'])").addClass("active");
    }
  });
};

const charCount = function () {
  $("#chars").text("0 of 200");
  $("#txt002").keydown(function () {
    $("#chars").text(`${$(this).val().length} of 200`);
  });
};

const openCloseHelpCallout = function () {
  $("#devkit-help-icon-wrapper").on("keydown click", function (e) {
    $(selector2).show();
    e.stopPropagation();
  });

  $(document).on("click", function (e) {
    if ($(e.target).closest(selector2).length === 0) {
      $(selector2).hide();
    }
  });

  $(document).on("keyup focusout", function (e) {
    if (e.key === "Escape") {
      $(selector2).hide();
    }
  });
};

const sliderRange = function () {
  $(selector6).slider({
    orientation: "horizontal",
    value: 0,
    slide(event, ui) {
      $(selector6).css(
        "background",
        `linear-gradient(90deg, #0076c0 ${ui.value}%, #cccccc 0%)`
      );
      $("#devkit-slider-value").val(ui.value);
    },
  });
  $("#devkit-slider-value").val($(selector6).slider("value"));
};

const accordionToggle = function () {
  const num = 300;
  $(selector7).on(event1, function (e) {
    e.stopPropagation();
    if ($(selector8).is(":visible")) {
      $(selector8).slideUp(num);
      $(selector9).removeClass(selector10).addClass(selector11);
      $(selector7).removeClass("selected");
    }
    if ($(this).next(selector8).is(":visible")) {
      $(this).next(selector8).slideUp(num);
      $(selector7).removeClass("selected");
      $(this).children(selector9).removeClass(selector10).addClass(selector11);
    } else {
      $(this).next(selector8).slideDown(num);
      $(this).children(selector9).removeClass(selector11).addClass(selector10);
      $(this).addClass("selected");
    }
  });
};

const codeDisplayToggle = function () {
  $(selector12).on("click", function (e) {
    e.stopPropagation();
    $(this)
      .siblings("pre")
      .slideToggle("fast", function () {
        /* empty, there is nothing to return */
      });
  });

  $(document).on("keyup", function (e) {
    if (e.key === "Escape") {
      $("pre").slideUp("fast", function () {
        /* empty, there is nothing to return */
      });
    }
  });

  $("pre .fa-times").on("click", function () {
    $("pre").slideUp("fast", function () {
      /* empty, there is nothing to return */
    });
  });
};

const multiselectPillDisplay = function () {
  $('.devkit-multi-checkbox-wrapper input[type="checkbox"]').change(
    function () {
      const checkbox = $(this);
      if (checkbox.is(":checked")) {
        // Shows the div with ID matching the value of checkbox toggled.
        $(`#${checkbox.attr("value")}`).show();
      } else {
        // Hides the div with ID matching the value of checkbox toggled.
        $(`#${checkbox.attr("value")}`).hide();
      }
    }
  );

  $(".devkit-pill-close").on("click", function () {
    const pillText = $(this).prev().text();
    $('.devkit-multi-checkbox-wrapper input[type="checkbox"]')
      .filter(function () {
        return this.value === pillText;
      })
      .prop("checked", false);
    $(`#${pillText}`).hide();
  });
};

const accessibleMenu = function () {
  $('li.devkit-nav-link:has("ul.submenu-nav")').on(
    "mouseover keyup mouseleave",
    // eslint-disable-next-line sonarjs/cognitive-complexity
    function (e) {
      if (e.key === "Tab" || e.type === "mouseover" || e.key === "Enter") {
        // show sub menu
        $(selector1).removeClass("nav-open");
        $(this).children(selector1).addClass("nav-open");
      }
      if (e.type === "mouseleave" || e.key === "Escape") {
        // hide sub menu
        $(this).children(selector1).removeClass("nav-open");
        $(selector17).children(selector15).removeClass(selector16);
      }

      $(selector17).on("mouseover keyup mouseleave", function () {
        if (e.key === "Tab" || e.type === "mouseover" || e.key === "Enter") {
          // show sub menu
          $(selector15).removeClass(selector16);
          $(this).children(selector15).addClass(selector16);
        }
        if (e.key === "mouseleave" || e.key === "Escape") {
          $(this).children(selector15).removeClass(selector16);
        }
      });

      $(
        "li.devkit-nav-link > ul.submenu-nav > li.devkit-inner-nav-link:last-child > a"
      ).on("keydown", function () {
        // If tabbing out of the last link in a sub menu and tabbing into another sub menu
        if (
          (e.key === "Tab" &&
            $(this).parent("li.devkit-nav-link").children("ul.submenu-nav")
              .length === 0) ||
          e.key === "Escape"
        ) {
          // Close this sub menu
          $(this)
            .parent("li.devkit-inner-nav-link")
            .parent(selector1)
            .removeClass("nav-open");
        }
      });

      $(
        "li.devkit-inner-nav-link.right > ul.child-menu > li.child-menu-item:last-child > a"
      ).on("keydown", function () {
        // If tabbing out of the last link in a sub menu and tabbing into another sub menu
        if (
          (e.key === "Tab" &&
            $(this)
              .parent("li.devkit-inner-nav-link.right")
              .children("ul.child-menu").length === 0) ||
          e.key === "Escape"
        ) {
          // Close this sub menu
          $(this)
            .parent("li.child-menu-item")
            .parent(selector15)
            .removeClass("child-nav-open");
        }
      });

      $(
        "li.devkit-nav-link > ul.submenu-nav > div.right > li.devkit-inner-nav-link:last-child > a"
      ).on("keydown", function () {
        // If tabbing out of the last link in side-by-side sub menu and tabbing into another sub menu
        if (
          (e.key === "Tab" &&
            $(this)
              .parent("li.devkit-nav-link")
              .children(selector1)
              .children("div.right").length === 0) ||
          e.key === "Escape"
        ) {
          $(this)
            .parent("li.devkit-inner-nav-link")
            .parent("div.right, div.left")
            .parent(selector1)
            .removeClass("nav-open");
        }
      });
    }
  );
};

const openPrintDialog = function () {
  $("#print-icon").on(event1, function () {
    window.print();
  });
};

const activateCheckbox = function () {
  $("input:checkbox, input:radio").keypress(function (e) {
    e.preventDefault();
    if (e.key === "Enter") {
      $(this).trigger("click");
    }
  });
};

const openModal = function () {
  $(".devkit-modal-wrapper #modal-button").on(event1, function () {
    $(".devkit-modal-overlay").addClass("active");
    $(selector13).addClass("active");
    $(selector12).attr("tabindex", "-1");
    $(selector14).attr("tabindex", "-1");
  });

  // Removes modal when user clicks 'I agree' button
  $(
    "#privacy-modal .devkit-modal .devkit-modal-body .devkit-buttons-wrapper button"
  ).on(event1, function () {
    $(".devkit-modal-overlay").removeClass("active");
    $(selector13).removeClass("active");
    $(selector12).attr("tabindex", "0");
    $(selector14).attr("tabindex", "0");
  });

  // To trap focus in the modal till it is closed.
  const arrOfSelectors2 = [
    "a[href]:not([disabled])",
    "button:not([disabled])",
    "textarea:not([disabled])",
    'input[type="text"]:not([disabled])',
    'input[type="radio"]:not([disabled])',
    'input[type="checkbox"]:not([disabled])',
    "select:not([disabled])",
  ];
  const modalFocusableElements = $(selector13).find(arrOfSelectors2.join(", "));
  const firstFocusableElement = modalFocusableElements[0];
  const lastFocusableElement =
    modalFocusableElements[modalFocusableElements.length - 1];

  $(this).on("keydown", function (e) {
    if (e.key !== "Tab") {
      return;
    }

    if (e.shiftKey) {
      /* shift + tab */
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else {
      /* tab */
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  });
};

// This is needed for IE 11. IE has a bug in implementing Skip to content feature.
const skipToContent = function () {
  $("#devkit-skip-to-main").on(event1, function (e) {
    e.preventDefault();
    window.location = "#main-content";
    $("#print-icon").focus();
  });
};

const copyCode = function () {
  const preTag = document.getElementsByTagName("pre");
  for (let i = 0; i < preTag.length; i += 1) {
    const isLanguage = preTag[i].children[0].className.indexOf("language-");
    if (isLanguage === 0) {
      const button = document.createElement("button");
      button.className = "copy-button";
      button.textContent = "Copy";
      preTag[i].appendChild(button);
    }
  }

  const clipboard = new ClipboardJS(selector14, {
    target(trigger) {
      return trigger.previousElementSibling;
    },
  });

  clipboard.on("success", function (e) {
    const timer = 1000;
    e.trigger.textContent = "Copied";
    window.setTimeout(function () {
      e.clearSelection();
      e.trigger.textContent = "Copy";
    }, timer);
  });
};

const openVerticalSubNav = function () {
  $("ul.devkit-left-nav-links li").bind("click", function (e) {
    e.stopPropagation();
    $(this)
      .children("ul.devkit-v-inner-nav")
      .slideToggle("fast", function () {
        /* empty, there is nothing to return */
      });
  });
  $("ul.devkit-left-nav-links li").keydown(function (k) {
    if (k.key === "Enter") {
      $(this).trigger("click");
    }
  });
};

const goToLink = function (url) {
  window.open(url, "_self");
};

$(document).ready(function () {
  if (
    window.devicePixelRatio > 1.0 &&
    navigator.userAgent.search("Chrome") > -1
  ) {
    $("body").addClass("zoomout");
  }
  openMobileNav();
  openMobileSubNav();
  openLeftSubNav();
  openMultiSelectDropdown();
  openGroupMultiSelectDropdown();
  closeMobileNav();
  openSearch();
  closeSearch();
  logInToggle();
  checkAll();
  tabSelect();
  formSelect();
  verticalTabSelect();
  openCloseHelpCallout();
  setActiveNav();
  charCount();
  sliderRange();
  multiselectPillDisplay();
  accordionToggle();
  accessibleMenu();
  openPrintDialog();
  activateCheckbox();
  openModal();
  skipToContent();
  codeDisplayToggle();
  copyCode();
  openVerticalSubNav();
  goToLink();
});
