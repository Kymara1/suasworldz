(function() {
  var Main, el,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  theme.classes.CoreBlog = (function() {
    function CoreBlog(root) {
      var _this;
      this.root = root;
      this.initMasonry = bind(this.initMasonry, this);
      this.eventListeners = bind(this.eventListeners, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.list = _this.root.find('.blog--article-list');
      if (_this.root.data('columns') > 1) {
        _this.load();
      }
    }

    CoreBlog.prototype.load = function() {
      var _this;
      _this = this;
      return libraryLoader('masonry', theme.assets.masonry, function() {
        if (theme.utils.mqs.current_window !== 'small') {
          _this.initMasonry();
        }
        return _this.eventListeners();
      });
    };

    CoreBlog.prototype.eventListeners = function() {
      var _this;
      _this = this;
      theme.window.off('theme:utils:mqs:updated');
      return theme.window.on('theme:utils:mqs:updated', function() {
        var masonry_loaded;
        masonry_loaded = _this.list.data('masonry-loaded');
        if (!(theme.utils.mqs.current_window === 'small' || masonry_loaded)) {
          return _this.initMasonry();
        } else if (theme.utils.mqs.current_window === 'small' && masonry_loaded) {
          _this.list.attr('data-masonry-loaded', false);
          return _this.masonry.destroy();
        }
      });
    };

    CoreBlog.prototype.initMasonry = function() {
      var _this;
      _this = this;
      _this.list.attr('data-masonry-loaded', true);
      return _this.masonry = new Masonry(_this.list.el[0], {
        itemSelector: '.article--item',
        percentPosition: true,
        horizontalOrder: true,
        columnWidth: '.article--item',
        gutter: 32
      });
    };

    return CoreBlog;

  })();

  theme.classes.CoreCarousel = (function() {
    function CoreCarousel(root) {
      var _this;
      this.root = root;
      this.toggleFocusableEl = bind(this.toggleFocusableEl, this);
      this.toggleDraggable = bind(this.toggleDraggable, this);
      this.getAllFocusableEl = bind(this.getAllFocusableEl, this);
      _this = this;
      _this.container = _this.root.find('.carousel--x-container');
      _this.dot_nav = _this.root.find('.carousel--dot-nav');
      _this.dot_nav_wrapper = _this.root.find('.carousel--dot-nav--wrapper');
      _this.dots = _this.root.find('.carousel--dot');
      _this.height_container = _this.root.find('.carousel--y-container');
      _this.links = _this.container.find('a');
      _this.next = _this.root.find('.carousel--next');
      _this.prev = _this.root.find('.carousel--prev');
      _this.at_end = _this.root.attr('data-at-end');
      _this.at_start = _this.root.attr('data-at-start');
      _this.auto_rotate = _this.root.data('auto-rotate');
      _this.blocks = _this.root.find('.carousel--block');
      _this.blocks_per_slide_desktop = _this.root.data('blocks-per-slide');
      _this.blocks_per_slide_mobile = _this.root.data('blocks-per-slide--mobile');
      _this.dot_nav_enabled = _this.root.attr('data-dot-nav');
      _this.rotate_frequency = _this.root.attr('data-rotate-frequency');
      _this.section_id = _this.root.closest('[data-section-id]').data('section-id');
      _this.total_blocks = _this.blocks.length;
      _this.transition_type = _this.root.attr('data-transition-type');
      _this.view = _this.root.data('view');
      _this.active_slide = 1;
      _this.autoplay_focus_enabled = false;
      _this.slide_pause = false;
      _this.container_destination = '0px';
      _this.trailing_dot_index = 0;
      _this.leading_dot_index = 0;
      _this.dot_nav_offset = 0;
      _this.draggable = true;
      _this.active_blocks = null;
      _this.auto_slide_timer = null;
      _this.blocks_per_slide = null;
      _this.old_active_blocks = null;
      _this.screen_size_loaded = null;
      _this.slide_count = null;
      _this.swipe_state = null;
      _this.window_width = null;
      _this.dot_change_type = null;
      theme.carousels[_this.section_id] = this;
      _this.load();
    }

    CoreCarousel.prototype.load = function() {
      var _this;
      _this = this;
      _this.resizeListener();
      _this.initNewScreenSize();
      _this.getAllFocusableEl();
      _this.updateActive();
      _this.setSliderHeight();
      _this.mouseDownListener();
      _this.swipeListener();
      _this.arrowNavListeners();
      _this.blockListener();
      if (_this.transition_type === 'slide') {
        _this.loadBlocks();
      }
      if (_this.auto_rotate) {
        _this.autoSlide();
        _this.stopAutoSlideWhenInteracting();
      }
      return _this.root.trigger('loaded');
    };

    CoreCarousel.prototype.initNewScreenSize = function() {
      var _this;
      _this = this;
      if (theme.utils.mqs.current_window === 'small') {
        if (_this.screen_size_loaded === 'small') {
          return;
        }
        _this.dot_nav.attr('data-loaded', 'false');
        _this.screen_size_loaded = 'small';
        _this.blocks_per_slide = _this.blocks_per_slide_mobile;
        _this.active_slide = Math.ceil((_this.blocks_per_slide_desktop * (_this.active_slide - 1) + 1) / _this.blocks_per_slide_mobile);
      } else {
        if (_this.screen_size_loaded === 'medium-large') {
          return;
        }
        _this.screen_size_loaded = 'medium-large';
        _this.blocks_per_slide = _this.blocks_per_slide_desktop;
        _this.active_slide = Math.ceil((_this.blocks_per_slide_mobile * (_this.active_slide - 1) + 1) / _this.blocks_per_slide_desktop);
      }
      _this.slide_count = Math.ceil(_this.total_blocks / _this.blocks_per_slide);
      _this.createDotNav();
      _this.dotNavListeners();
      _this.goToActiveSlide();
      return _this.updateActiveDot();
    };

    CoreCarousel.prototype.getAllFocusableEl = function() {
      var _this;
      _this = this;
      return _this.focusable_el = theme.utils.getFocusableEl(_this.root);
    };

    CoreCarousel.prototype.loadBlocks = function() {
      var _this;
      _this = this;
      return _this.blocks.each(function(block) {
        block.setAttribute('data-loaded', 'true');
        return block.setAttribute('data-loaded--mobile', 'true');
      });
    };

    CoreCarousel.prototype.blockListener = function() {
      var _this;
      _this = this;
      return _this.blocks.on('theme:block:select', function() {
        _this.active_slide = Math.ceil((el(this).index() + 1) / _this.blocks_per_slide);
        _this.updateActive();
        _this.goToActiveSlide(true);
        _this.updateActiveDot();
        return _this.setSliderHeight();
      });
    };

    CoreCarousel.prototype.toggleDraggable = function(toggle) {
      var _this;
      if (toggle == null) {
        toggle = 'opposite';
      }
      _this = this;
      if (toggle === 'opposite') {
        _this.draggable = !_this.draggable;
      }
      if (toggle === true) {
        return _this.draggable = true;
      } else if (toggle === false) {
        return _this.draggable = false;
      }
    };

    CoreCarousel.prototype.checkForActiveModel = function(target) {
      var _this, model, model_disabled;
      _this = this;
      model = el(target.closest('model-viewer'));
      if (model.length) {
        model_disabled = model.hasClass('shopify-model-viewer-ui__disabled');
        if (!model_disabled) {
          return true;
        }
      }
      return false;
    };

    CoreCarousel.prototype.mouseDownListener = function() {
      var _this;
      _this = this;
      return _this.container.on('mousedown touchstart', function(event) {
        if (_this.checkForActiveModel(event.target) || !_this.draggable) {
          return false;
        }
        _this.swipe_state = 'swipe-started';
        _this.reenableClickAfterSwiping();
        _this.mouseUpListener();
        _this.slide_pause = true;
        if (_this.transition_type === 'slide') {
          _this.drag_start = event.pageX;
          _this.container_x = _this.container.css('transform').replace(/[^0-9\-.,]/g, '').split(',')[4];
          _this.container.attr('data-transition', '');
          _this.container.css('transform', "translateX(" + _this.container_x + "px)");
          return _this.dragBegin();
        }
      }, true);
    };

    CoreCarousel.prototype.mouseUpListener = function() {
      var _this;
      _this = this;
      return theme.window.on("mouseup." + _this.section_id + " touchend." + _this.section_id, function() {
        _this.swipe_state = 'swipe-ended';
        _this.removeMouseUpListener();
        _this.dragEnd();
        if (_this.slide_pause === true) {
          _this.container.attr('data-transition', 'forwards');
          return _this.container.css('transform', "translateX(" + _this.container_destination + ")");
        }
      }, true);
    };

    CoreCarousel.prototype.removeMouseUpListener = function() {
      var _this;
      _this = this;
      return theme.window.off("mouseup." + _this.section_id + " touchend." + _this.section_id);
    };

    CoreCarousel.prototype.dragBegin = function() {
      var _this;
      _this = this;
      _this.root.attr('data-dragging', 'true');
      return theme.window.on("mousemove." + _this.section_id + " touchmove." + _this.section_id, function(event) {
        var offset, slide_x_start;
        offset = _this.container_x - _this.drag_start + event.pageX;
        slide_x_start = _this.window_width * (_this.slide_count - 1);
        if (offset > 0) {
          return _this.container.css('transform', "translateX(" + (offset / 4) + "px)");
        } else if (offset < slide_x_start * -1) {
          offset = offset * -1;
          offset = slide_x_start + (offset - slide_x_start) / 4;
          return _this.container.css('transform', "translateX(-" + offset + "px)");
        } else {
          return _this.container.css('transform', "translateX(" + offset + "px)");
        }
      }, true);
    };

    CoreCarousel.prototype.dragEnd = function() {
      var _this;
      _this = this;
      _this.root.attr('data-dragging', 'false');
      return theme.window.off("mousemove." + _this.section_id + " touchmove." + _this.section_id);
    };

    CoreCarousel.prototype.updateContainerDestination = function(index) {
      var _this;
      _this = this;
      return _this.container_destination = (_this.active_slide - 1) / _this.slide_count * -100 + '%';
    };

    CoreCarousel.prototype.slideToNext = function(loop_to_start) {
      var _this, transition_direction;
      if (loop_to_start == null) {
        loop_to_start = false;
      }
      _this = this;
      _this.dot_change_type = 'iterate';
      if (_this.active_slide !== _this.slide_count) {
        _this.updateActive('next');
        transition_direction = 'forwards';
      } else if (loop_to_start && _this.active_slide === _this.slide_count) {
        _this.active_slide = 1;
        _this.updateActive();
        transition_direction = 'forwards';
      } else if (_this.active_slide === _this.slide_count) {
        transition_direction = 'backwards';
      }
      if (_this.transition_type === 'slide') {
        _this.updateContainerDestination();
        _this.container.css('transform', "translateX(" + _this.container_destination + ")");
      } else if (_this.transition_type === 'fade') {
        _this.fadeSlides();
      }
      return _this.container.attr('data-transition', transition_direction);
    };

    CoreCarousel.prototype.slideToPrev = function() {
      var _this, transition_direction;
      _this = this;
      _this.dot_change_type = 'iterate';
      if (_this.active_slide !== 1) {
        _this.updateActive('prev');
        transition_direction = 'forwards';
      } else if (_this.active_slide === 1) {
        transition_direction = 'backwards';
      }
      if (_this.transition_type === 'slide') {
        _this.updateContainerDestination();
        _this.container.css('transform', "translateX(" + _this.container_destination + ")");
      } else if (_this.transition_type === 'fade') {
        _this.fadeSlides();
      }
      return _this.container.attr('data-transition', transition_direction);
    };

    CoreCarousel.prototype.goToActiveSlide = function(animate) {
      var _this;
      if (animate == null) {
        animate = false;
      }
      _this = this;
      _this.dot_change_type = 'init';
      if (_this.transition_type === 'slide') {
        _this.updateContainerDestination();
        _this.container.css('transform', "translateX(" + _this.container_destination + ")");
      } else if (_this.transition_type === 'fade') {
        _this.fadeSlides();
      }
      if (animate) {
        return _this.container.attr('data-transition', 'forwards');
      }
    };

    CoreCarousel.prototype.checkStartEnd = function() {
      var _this;
      _this = this;
      if (_this.active_slide === 1) {
        _this.at_start = true;
        _this.prev.attr('tabindex', '-1');
      } else {
        _this.at_start = false;
        _this.prev.attr('tabindex', '0');
      }
      _this.root.attr('data-at-start', _this.at_start);
      if (_this.active_slide === _this.slide_count) {
        _this.at_end = true;
        _this.next.attr('tabindex', '-1');
      } else {
        _this.at_end = false;
        _this.next.attr('tabindex', '0');
      }
      return _this.root.attr('data-at-end', _this.at_end);
    };

    CoreCarousel.prototype.updateActive = function(direction) {
      var _this, higher_range, lower_range;
      if (direction == null) {
        direction = false;
      }
      _this = this;
      if (direction === 'next') {
        _this.active_slide += 1;
        if (!(_this.autoplay_focus_enabled === false && _this.auto_rotate)) {
          _this.prev.focus(0);
        }
      } else if (direction === 'prev') {
        _this.active_slide -= 1;
        if (!(_this.autoplay_focus_enabled === false && _this.auto_rotate)) {
          _this.next.focus(0);
        }
      }
      lower_range = (_this.active_slide - 1) * _this.blocks_per_slide;
      higher_range = lower_range + _this.blocks_per_slide;
      if (_this.active_blocks !== null) {
        _this.old_active_blocks = _this.active_blocks;
      }
      _this.active_blocks = el(Array.from(_this.blocks.el).slice(lower_range, higher_range));
      _this.toggleFocusableEl(direction);
      return _this.checkStartEnd();
    };

    CoreCarousel.prototype.toggleFocusableEl = function(direction) {
      var _this;
      _this = this;
      if (_this.disabled_el) {
        _this.disabled_el.attr('tabindex', '0');
      }
      _this.disabled_el = theme.utils.getFocusableEl(_this.blocks.not(_this.active_blocks));
      if (_this.disabled_el) {
        return _this.disabled_el.attr('tabindex', '-1');
      }
    };

    CoreCarousel.prototype.setSliderHeight = function() {
      var _this, tallest;
      _this = this;
      tallest = 0;
      _this.active_blocks.each(function(block) {
        var height;
        height = block.offsetHeight;
        if (height > tallest) {
          return tallest = height;
        }
      });
      return _this.height_container.css('height', tallest + "px");
    };

    CoreCarousel.prototype.swipeListener = function() {
      var _this;
      _this = this;
      document.addEventListener('theme:swipe:left', function() {
        if (_this.swipe_state === 'swipe-started') {
          _this.slide_pause = false;
          _this.slideToNext();
          _this.setSliderHeight();
          _this.updateActiveDot();
          return _this.preventClickWhenSwiping();
        }
      });
      return document.addEventListener('theme:swipe:right', function() {
        if (_this.swipe_state === 'swipe-started') {
          _this.slide_pause = false;
          _this.slideToPrev();
          _this.setSliderHeight();
          _this.updateActiveDot();
          return _this.preventClickWhenSwiping();
        }
      });
    };

    CoreCarousel.prototype.createDotNav = function() {
      var _this, carousel_dot, i, j, ref;
      _this = this;
      if (!_this.dot_nav_enabled || _this.slide_count === 1) {
        return;
      }
      _this.dot_nav.empty();
      for (i = j = 1, ref = _this.slide_count; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
        carousel_dot = theme.utils.parseHtml('<div class="carousel--dot"></div>');
        _this.dot_nav.append(carousel_dot);
      }
      _this.dots = _this.root.find('.carousel--dot');
      if (theme.utils.mqs.current_window === 'small') {
        return _this.dots.attr('tabindex', '0');
      }
    };

    CoreCarousel.prototype.updateActiveDot = function() {
      var _this;
      _this = this;
      _this.dots.attr('data-active', 'false');
      _this.dots.eq(_this.active_slide - 1).attr('data-active', 'true');
      if (_this.dots.length > 5) {
        return _this.updateTrailingLeadingDots();
      } else {
        _this.alignDots();
        return _this.dot_nav.attr('data-loaded', 'true');
      }
    };

    CoreCarousel.prototype.updateTrailingLeadingDots = function() {
      var _this, active, initial_offset, offset_initial;
      _this = this;
      if (_this.active_slide === _this.leading_dot_index) {
        _this.leading_dot_index++;
        _this.trailing_dot_index++;
        active = _this.dots.eq(_this.active_slide - 1);
        active.attr('data-position', '');
        initial_offset = active.offset().left;
        setTimeout(function() {
          _this.dots.eq(_this.active_slide - 4).attr('data-position', 'trailing-1');
          _this.dots.eq(_this.active_slide - 5).attr('data-position', 'trailing-2');
          if (_this.active_slide >= 5) {
            _this.dots.filter(":nth-child(-n+" + (_this.active_slide - 5) + ")").attr('data-position', 'hidden');
          }
          _this.dots.eq(_this.active_slide).attr('data-position', 'leading-1');
          _this.dots.eq(_this.active_slide + 1).attr('data-position', 'leading-2');
          _this.dots.filter(":nth-child(n+" + (_this.active_slide + 3) + ")").attr('data-position', 'hidden');
          _this.alignDots(initial_offset);
          if (_this.dot_change_type === 'init') {
            _this.alignDots();
            return _this.dot_nav.attr('data-loaded', 'true');
          }
        }, 0);
        return setTimeout(function() {
          _this.dot_nav.attr('data-transition', 'true');
          return _this.alignDots();
        }, 200);
      } else if (_this.active_slide === _this.trailing_dot_index) {
        _this.leading_dot_index--;
        _this.trailing_dot_index--;
        active = _this.dots.eq(_this.active_slide - 1);
        active.attr('data-position', '');
        offset_initial = active.offset().left;
        setTimeout(function() {
          _this.dots.eq(_this.active_slide - 2).attr('data-position', 'trailing-1');
          _this.dots.eq(_this.active_slide - 3).attr('data-position', 'trailing-2');
          _this.dots.eq(_this.active_slide + 2).attr('data-position', 'leading-1');
          _this.dots.eq(_this.active_slide + 3).attr('data-position', 'leading-2');
          _this.dots.filter(":nth-child(n+" + (_this.active_slide + 5) + ")").attr('data-position', 'hidden');
          if (_this.active_slide >= 4) {
            _this.dots.filter(":nth-child(-n+" + (_this.active_slide - 2) + ")").attr('data-position', 'hidden');
          }
          _this.alignDots(initial_offset);
          if (_this.dot_change_type === 'init') {
            _this.alignDots();
            return _this.dot_nav.attr('data-loaded', 'true');
          }
        }, 0);
        return setTimeout(function() {
          _this.dot_nav.attr('data-transition', 'true');
          return _this.alignDots();
        }, 200);
      } else if (_this.dot_change_type === 'init') {
        _this.dots.attr('data-position', '');
        if (_this.slide_count - _this.active_slide <= 2) {
          _this.leading_dot_index = _this.active_slide;
          _this.trailing_dot_index = _this.active_slide - 3;
        } else if (_this.slide_count - _this.active_slide > 2) {
          _this.trailing_dot_index = _this.active_slide;
          _this.leading_dot_index = _this.active_slide + 3;
        }
        return _this.updateTrailingLeadingDots();
      }
    };

    CoreCarousel.prototype.alignDots = function(offset_initial) {
      var _this, new_offset, offset_difference;
      if (offset_initial == null) {
        offset_initial = false;
      }
      _this = this;
      if (offset_difference) {
        offset_difference = offset_initial - active.offset().left;
        new_offset = _this.dot_nav_offset + offset_difference + "px";
        _this.dot_nav.attr('data-transition', 'false');
        return _this.dot_nav.css('transform', "translateX(" + new_offset + ")");
      } else {
        _this.dot_nav_offset = (_this.root.width() - _this.dot_nav.width()) / 2;
        return _this.dot_nav.css('transform', "translateX(" + _this.dot_nav_offset + "px)");
      }
    };

    CoreCarousel.prototype.dotNavListeners = function() {
      var _this;
      _this = this;
      _this.dots.off("click." + _this.section_id + " keydown." + _this.section_id);
      return _this.dots.on("click." + _this.section_id + " keydown." + _this.section_id, function() {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        _this.active_slide = el(this).index() + 1;
        _this.updateActive();
        _this.goToActiveSlide(true);
        _this.setSliderHeight();
        return _this.updateActiveDot();
      });
    };

    CoreCarousel.prototype.arrowNavListeners = function() {
      var _this;
      _this = this;
      _this.prev.on('click keydown', function(event) {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        _this.slideToPrev();
        _this.setSliderHeight();
        return _this.updateActiveDot();
      });
      return _this.next.on('click keydown', function(event) {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        _this.slideToNext();
        _this.setSliderHeight();
        return _this.updateActiveDot();
      });
    };

    CoreCarousel.prototype.resizeListener = function() {
      var _this;
      _this = this;
      _this.window_width = document.documentElement.clientWidth;
      return theme.window.on("resize." + _this.section_id, theme.utils.debounce(100, function() {
        _this.window_width = document.documentElement.clientWidth;
        _this.initNewScreenSize();
        _this.updateActive();
        _this.setSliderHeight();
        _this.alignDots();
        if (theme.utils.mqs.current_window === 'small') {
          return _this.dots.attr('tabindex', '0');
        } else {
          return _this.dots.removeAttr('tabindex');
        }
      }));
    };

    CoreCarousel.prototype.reenableClickAfterSwiping = function() {
      var _this;
      _this = this;
      return _this.links.off("click." + _this.section_id);
    };

    CoreCarousel.prototype.preventClickWhenSwiping = function() {
      var _this;
      _this = this;
      return _this.links.on("click." + _this.section_id, function(event) {
        return event.preventDefault();
      });
    };

    CoreCarousel.prototype.autoSlide = function() {
      var _this;
      _this = this;
      return _this.auto_slide_timer = setInterval(function() {
        _this.slideToNext(true);
        _this.updateActiveDot();
        return _this.setSliderHeight();
      }, _this.rotate_frequency * 1000);
    };

    CoreCarousel.prototype.stopAutoSlideWhenInteracting = function() {
      var _this;
      _this = this;
      _this.root.on('click touchstart', function() {
        _this.autoplay_focus_enabled = true;
        clearInterval(_this.auto_slide_timer);
        return _this.root.off('click touchstart');
      }, true);
      return _this.focusable_el.on('focus', function() {
        _this.autoplay_focus_enabled = true;
        clearInterval(_this.auto_slide_timer);
        return _this.focusable_el.off('focus');
      }, true);
    };

    CoreCarousel.prototype.fadeSlides = function() {
      var _this;
      _this = this;
      if (_this.active_blocks === null || _this.old_active_blocks === null) {
        return;
      }
      _this.blocks.attr('data-active', '');
      _this.blocks.attr('data-loaded', 'false');
      _this.blocks.attr('data-loaded--mobile', 'false');
      _this.old_active_blocks.each(function(active_block) {
        active_block.setAttribute('data-active', 'old');
        return active_block.style.left = '0%';
      });
      return _this.active_blocks.each(function(active_block, index) {
        var left;
        left = 100 / _this.total_blocks * index + "%";
        active_block.setAttribute('data-active', 'new');
        return active_block.style.left = left;
      });
    };

    CoreCarousel.prototype.updateThenGoToActiveSlide = function(slide_num) {
      var _this;
      _this = this;
      _this.active_slide = slide_num;
      _this.goToActiveSlide();
      _this.setSliderHeight();
      return _this.updateActiveDot();
    };

    return CoreCarousel;

  })();

  theme.classes.CoreCart = (function() {
    function CoreCart(root) {
      var _this;
      this.root = root;
      this.renderDynamicCheckoutButtons = bind(this.renderDynamicCheckoutButtons, this);
      this.updateTotals = bind(this.updateTotals, this);
      this.updateAllHasItems = bind(this.updateAllHasItems, this);
      this.addItem = bind(this.addItem, this);
      this.swapInImages = bind(this.swapInImages, this);
      this.getHtml = bind(this.getHtml, this);
      this.updateHtml = bind(this.updateHtml, this);
      this.htmlListener = bind(this.htmlListener, this);
      this.updateAllHtml = bind(this.updateAllHtml, this);
      this.updateNote = bind(this.updateNote, this);
      this.noteTypingListener = bind(this.noteTypingListener, this);
      this.updateQuantity = bind(this.updateQuantity, this);
      this.clearRequests = bind(this.clearRequests, this);
      this.toggleLoadingDisplay = bind(this.toggleLoadingDisplay, this);
      this.toggleLoadingOnSubmit = bind(this.toggleLoadingOnSubmit, this);
      this.removeItem = bind(this.removeItem, this);
      this.removeButtonListener = bind(this.removeButtonListener, this);
      this.minusButtonListener = bind(this.minusButtonListener, this);
      this.plusButtonListener = bind(this.plusButtonListener, this);
      this.inputBoxListener = bind(this.inputBoxListener, this);
      this.eventListeners = bind(this.eventListeners, this);
      this.getOtherCarts = bind(this.getOtherCarts, this);
      _this = this;
      _this.is_drawer = _this.root.data('is-drawer');
      _this.other_carts = _this.getOtherCarts();
      _this.quantity_request = {};
      _this.quantity_timer = {};
      _this.total_item_count = document.querySelectorAll('.cart--external--total-items');
      _this.total_price = document.querySelectorAll('.cart--external--total-price');
      _this.update_html = new Event('update-html');
      _this.view = _this.root.attr('data-view');
      _this.htmlListener();
      _this.eventListeners();
      _this.renderDynamicCheckoutButtons();
    }

    CoreCart.prototype.getOtherCarts = function() {
      var _this, other_carts;
      _this = this;
      other_carts = [];
      document.querySelectorAll('[data-js-class="Cart"]').forEach(function(cart) {
        if (cart !== _this.root.el[0]) {
          return other_carts.push(cart);
        }
      });
      return other_carts;
    };

    CoreCart.prototype.eventListeners = function() {
      var _this;
      _this = this;
      _this.inputBoxListener();
      _this.plusButtonListener();
      _this.minusButtonListener();
      _this.removeButtonListener();
      _this.toggleLoadingOnSubmit();
      return _this.noteTypingListener();
    };

    CoreCart.prototype.inputBoxListener = function() {
      var _this, input_box;
      _this = this;
      input_box = _this.root.find('.cart--quantity--input');
      input_box.on('keydown', function(event) {
        if ((event.which < 48 || event.which > 57) && (event.which < 37 || event.which > 40) && event.which !== 8 && event.which !== 9) {
          return event.preventDefault();
        }
      });
      return input_box.on('focusout', function(event) {
        var line_num, quantity;
        line_num = this.closest('.cart--item').dataset.lineNum;
        _this.toggleLoadingDisplay(line_num);
        _this.clearRequests(line_num);
        quantity = isNaN(parseInt(this.value)) ? 1 : parseInt(this.value);
        if (quantity === 0) {
          return _this.removeItem(line_num);
        } else {
          return _this.updateQuantity(line_num, quantity, 0, function(success, error) {
            if (success) {
              return _this.updateAllHtml(function() {});
            } else {
              return _this.updateAllHtml(function() {
                var cart_item;
                cart_item = _this.root.find(".cart--item[data-line-num='" + line_num + "']");
                return cart_item.find('.cart--error').removeAttr('style');
              });
            }
          });
        }
      });
    };

    CoreCart.prototype.plusButtonListener = function() {
      var _this, plus_button;
      _this = this;
      plus_button = _this.root.find('.cart--plus');
      return plus_button.on('click keydown', function(event) {
        var input, line_num, quantity;
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        event.preventDefault();
        input = this.previousElementSibling;
        line_num = this.closest('.cart--item').dataset.lineNum;
        quantity = isNaN(parseInt(input.value)) ? 1 : parseInt(input.value) + 1;
        input.value = quantity;
        _this.toggleLoadingDisplay(line_num);
        _this.clearRequests(line_num);
        _this.updateQuantity(line_num, quantity, 700, function(success, error) {
          if (success) {
            return _this.updateAllHtml(function() {});
          } else {
            return _this.updateAllHtml(function() {
              var cart_item;
              cart_item = _this.root.find(".cart--item[data-line-num='" + line_num + "']");
              return cart_item.find('.cart--error').removeAttr('style');
            });
          }
        });
        event.preventDefault();
        return event.stopPropagation();
      });
    };

    CoreCart.prototype.minusButtonListener = function() {
      var _this, minus_button;
      _this = this;
      minus_button = _this.root.find('.cart--minus');
      return minus_button.on('click keydown', function(event) {
        var input, line_num, quantity;
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        event.preventDefault();
        input = this.closest('.cart--quantity--container').querySelector('input');
        line_num = this.closest('.cart--item').dataset.lineNum;
        quantity = isNaN(parseInt(input.value)) ? 1 : parseInt(input.value) - 1;
        if (quantity < 1) {
          quantity = 1;
        }
        input.value = quantity;
        _this.toggleLoadingDisplay(line_num);
        _this.clearRequests(line_num);
        _this.updateQuantity(line_num, quantity, 700, function(success) {
          if (success) {
            return _this.updateAllHtml(function() {});
          }
        });
        event.preventDefault();
        return event.stopPropagation();
      });
    };

    CoreCart.prototype.removeButtonListener = function() {
      var _this, remove_button;
      _this = this;
      remove_button = _this.root.find('.cart--item--remove');
      return remove_button.on('click', function(event) {
        var line_num;
        event.preventDefault();
        line_num = this.closest('.cart--item').dataset.lineNum;
        _this.toggleLoadingDisplay(line_num);
        _this.clearRequests(line_num);
        _this.removeItem(line_num);
        event.preventDefault();
        return event.stopPropagation();
      });
    };

    CoreCart.prototype.removeItem = function(line_num) {
      var _this;
      _this = this;
      return _this.updateQuantity(line_num, 0, 0, function(success) {
        if (success) {
          return _this.updateAllHtml(function() {});
        }
      });
    };

    CoreCart.prototype.toggleLoadingOnSubmit = function() {
      var _this;
      _this = this;
      _this.checkout_button = _this.root.find('.cart--checkout-button button');
      return _this.checkout_button.on('click', function() {
        return this.setAttribute('data-loading', true);
      });
    };

    CoreCart.prototype.toggleLoadingDisplay = function(line_num) {
      var _this, input;
      _this = this;
      input = _this.root.find(".cart--item[data-line-num='" + line_num + "'] input");
      input.attr('data-loading', 'true');
      _this.checkout_button.attr('disabled', true);
      return _this.root.find('.cart--additional-buttons').css('visibility', 'hidden');
    };

    CoreCart.prototype.clearRequests = function(line_num) {
      var _this;
      _this = this;
      if (_this.quantity_request.line_num) {
        _this.quantity_request.line_num.abort();
      }
      if (_this.quantity_timer.line_num) {
        return clearTimeout(_this.quantity_timer.line_num);
      }
    };

    CoreCart.prototype.updateQuantity = function(line_num, requested_quantity, time_out, callback) {
      var _this, ajaxQuantity, all_items_added, cart_item, inventory_management, inventory_policy, inventory_quantity;
      _this = this;
      cart_item = _this.root.find(".cart--item[data-line-num='" + line_num + "']");
      inventory_management = cart_item.data('inventory-management');
      inventory_policy = cart_item.data('inventory-policy');
      inventory_quantity = cart_item.data('inventory-quantity');
      all_items_added = false;
      if (requested_quantity > inventory_quantity && (inventory_management === 'shopify' && inventory_policy !== 'continue')) {
        all_items_added = true;
        requested_quantity = inventory_quantity;
      }
      ajaxQuantity = function() {
        var request;
        request = new XMLHttpRequest();
        request.onload = function() {
          if (request.status >= 200 && request.status < 300) {
            _this.updateTotals();
            return callback(!all_items_added);
          }
        };
        request.onerror = function() {
          return console.log(request.statusText + ": quantity update request failed!");
        };
        request.open("POST", theme.urls.cart_change + ".js");
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(JSON.stringify({
          line: line_num,
          quantity: requested_quantity
        }));
        return _this.quantity_request.line_num = request;
      };
      return _this.quantity_timer.line_num = setTimeout(ajaxQuantity, time_out);
    };

    CoreCart.prototype.noteTypingListener = function() {
      var _this, note_textbox;
      _this = this;
      note_textbox = _this.root.find('.cart--notes--textarea');
      return note_textbox.on('input', function() {
        if (_this.note_request) {
          _this.note_request.abort();
        }
        if (_this.note_timer) {
          clearTimeout(_this.note_timer);
        }
        return _this.updateNote(this.value);
      });
    };

    CoreCart.prototype.updateNote = function(note) {
      var _this, ajaxNote;
      _this = this;
      ajaxNote = function() {
        var request;
        request = new XMLHttpRequest();
        request.onload = function() {
          if (request.status >= 200 && request.status < 300) {
            return _this.other_carts.forEach(function(cart) {
              return cart.dispatchEvent(_this.update_html);
            });
          }
        };
        request.onerror = function() {
          return console.log(request.statusText + ": cart note update request failed!");
        };
        request.open("POST", theme.urls.cart + "/update.js");
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(JSON.stringify({
          note: note
        }));
        return _this.note_request = request;
      };
      return _this.note_timer = setTimeout(ajaxNote, 350);
    };

    CoreCart.prototype.updateAllHtml = function(update_all_html_done) {
      var _this;
      _this = this;
      _this.updateHtml(update_all_html_done);
      return _this.other_carts.forEach(function(cart) {
        return cart.dispatchEvent(_this.update_html);
      });
    };

    CoreCart.prototype.htmlListener = function() {
      var _this;
      _this = this;
      return _this.root.on('update-html', function() {
        return _this.updateHtml(function() {});
      });
    };

    CoreCart.prototype.updateHtml = function(update_all_html_done) {
      var _this;
      _this = this;
      return _this.getHtml(_this.view, function(new_html) {
        var new_form, old_form;
        old_form = _this.root.find('.cart--form');
        new_form = new_html.find('.cart--form');
        new_form = _this.swapInImages(old_form, new_form);
        old_form.replaceWith(new_form);
        _this.eventListeners();
        update_all_html_done();
        if (_this.is_drawer) {
          theme.partials.OffCanvas.unload();
          theme.partials.OffCanvas.load();
        }
        return window.dispatchEvent(new Event('theme:cart:updated'));
      });
    };

    CoreCart.prototype.getHtml = function(view, callback) {
      var _this, request, url;
      _this = this;
      url = theme.urls.cart + "?view=ajax-desktop";
      if (view === 'mobile' && _this.is_drawer) {
        url = theme.urls.cart + "?view=ajax-drawer";
      } else if (view === 'mobile') {
        url = theme.urls.cart + "?view=ajax-mobile";
      }
      request = new XMLHttpRequest();
      request.onload = function() {
        var cart_html;
        if (request.status >= 200 && request.status < 300) {
          cart_html = theme.utils.parseHtml(request.response, '.cart--root');
          return callback(cart_html);
        }
      };
      request.onerror = function() {
        return console.log(request.statusText + ": cart HTML update request failed!");
      };
      request.open("GET", url);
      return request.send();
    };

    CoreCart.prototype.swapInImages = function(old_html, new_html) {
      var _this, new_items;
      _this = this;
      new_items = new_html.find('.cart--item');
      new_items.each(function(new_item) {
        var new_image, new_instance, new_item_el, old_image, old_item, variant_id;
        new_item_el = el(new_item);
        variant_id = new_item_el.attr('data-variant-id');
        new_image = new_item_el.find('.cart--item--image');
        new_instance = new_html.find("[data-variant-id='" + variant_id + "'] .cart--item--image").index(new_image);
        old_item = old_html.find("[data-variant-id='" + variant_id + "']").eq(new_instance);
        if (old_item.length) {
          old_image = old_item.find('.cart--item--image');
          return new_image.replaceWith(old_image);
        }
      });
      return new_html;
    };

    CoreCart.prototype.addItem = function(form, callback) {
      var _this, form_data, form_query_string, request;
      _this = this;
      request = new XMLHttpRequest();
      request.onload = function() {
        if (request.status >= 200 && request.status < 300) {
          _this.updateTotals();
          return callback(true);
        }
      };
      request.onerror = function() {
        console.log(request.statusText + ": cart add item request failed!");
        return callback(false, request.statusText);
      };
      request.open("POST", theme.urls.cart_add + ".js");
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      form_data = new FormData(form);
      form_query_string = new URLSearchParams(form_data).toString();
      return request.send(form_query_string);
    };

    CoreCart.prototype.updateAllHasItems = function(item_count, force_true) {
      var _this, has_items;
      if (force_true == null) {
        force_true = false;
      }
      _this = this;
      has_items = false;
      if (item_count > 0 || force_true) {
        has_items = true;
      }
      _this.root.attr('data-has-items', has_items);
      return _this.other_carts.forEach(function(cart) {
        return cart.setAttribute('data-has-items', has_items);
      });
    };

    CoreCart.prototype.updateTotals = function() {
      var _this, request;
      _this = this;
      request = new XMLHttpRequest();
      request.onload = function() {
        var count, data, total_price;
        if (request.status >= 200 && request.status < 300) {
          data = JSON.parse(request.response);
          theme.classes.Cart.setItems(data.items);
          total_price = theme.utils.formatMoney(data.total_price);
          count = parseInt(data.item_count);
          _this.total_price.forEach(function(price) {
            return price.textContent = total_price;
          });
          _this.total_item_count.forEach(function(item_count) {
            return item_count.textContent = count;
          });
          _this.updateAllHasItems(count);
          return _this.updateTotalsComplete(count);
        }
      };
      request.onerror = function() {
        return console.log(request.statusText + ": error updating cart totals!");
      };
      request.open("GET", theme.urls.cart + ".js");
      return request.send();
    };

    CoreCart.prototype.renderDynamicCheckoutButtons = function() {
      var _this, buttons, desktop_buttons;
      _this = this;
      if (window.location.pathname === theme.urls.cart) {
        buttons = document.querySelector('.off-canvas--right-sidebar .cart--additional-buttons');
        if (buttons) {
          buttons.parentNode.removeChild(buttons);
        }
        if (theme.utils.mqs.current_window === 'small') {
          desktop_buttons = document.querySelector('[data-view="desktop"] .cart--additional-buttons');
          if (desktop_buttons) {
            return desktop_buttons.parentNode.removeChild(desktop_buttons);
          }
        }
      }
    };

    CoreCart.getItems = function() {
      var request;
      request = new XMLHttpRequest();
      request.onload = function() {
        var data;
        if (request.status >= 200 && request.status < 300) {
          data = JSON.parse(request.response);
          return theme.classes.Cart.setItems(data.items);
        }
      };
      request.onerror = function() {
        return console.log(request.statusText + ": error updating cart totals!");
      };
      request.open("GET", theme.urls.cart + ".js");
      return request.send();
    };

    CoreCart.setItems = function(data_items) {
      var cart_items;
      cart_items = {};
      data_items.forEach(function(item) {
        return cart_items[item.id] = item.quantity;
      });
      return localStorage.setItem(theme.local_storage.cart_items, JSON.stringify(cart_items));
    };

    return CoreCart;

  })();

  theme.classes.CoreCollection = (function() {
    function CoreCollection(root) {
      var _this;
      this.root = root;
      this.loadHoverImages = bind(this.loadHoverImages, this);
      this.updateProductsListener = bind(this.updateProductsListener, this);
      this.resizeListener = bind(this.resizeListener, this);
      this.matchImageHeights = bind(this.matchImageHeights, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_width = window.innerWidth;
      _this.grid_container = _this.root.find('.collection--body--grid');
      _this.load();
    }

    CoreCollection.prototype.load = function() {
      var _this;
      _this = this;
      _this.matchImageHeights();
      _this.resizeListener();
      _this.updateProductsListener();
      if (theme.settings.hover_image_enabled) {
        return _this.loadHoverImages();
      }
    };

    CoreCollection.prototype.matchImageHeights = function() {
      var _this;
      _this = this;
      return theme.utils.matchImageHeights(_this.grid_container, _this.root.find('.product--root'), '.product--image-wrapper', _this.root.find('.featured-content--root'));
    };

    CoreCollection.prototype.resizeListener = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.Collection', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.matchImageHeights();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    CoreCollection.prototype.updateProductsListener = function() {
      var _this;
      _this = this;
      return theme.window.on('theme:navigation:productsUpdated', function() {
        _this.matchImageHeights();
        if (theme.settings.hover_image_enabled) {
          return _this.loadHoverImages();
        }
      });
    };

    CoreCollection.prototype.loadHoverImages = function() {
      var _this;
      _this = this;
      return _this.root.find('.product--hover-image').each(function(hover_image) {
        return theme.utils.imagesLoaded(hover_image, function() {
          var product;
          product = hover_image.closest('[data-hover-image="true"]');
          return product.setAttribute('data-hover-image', 'loaded');
        });
      });
    };

    return CoreCollection;

  })();

  theme.classes.CoreDisclosure = (function() {
    function CoreDisclosure(root) {
      var _this;
      this.root = root;
      this.optionChangeCallback = bind(this.optionChangeCallback, this);
      this.updateFormPosition = bind(this.updateFormPosition, this);
      this.toggleFormDisplay = bind(this.toggleFormDisplay, this);
      this.setOptionOnClick = bind(this.setOptionOnClick, this);
      this.hideFormWhenFocusOut = bind(this.hideFormWhenFocusOut, this);
      this.showFormWhenClick = bind(this.showFormWhenClick, this);
      this.updateFormListeners = bind(this.updateFormListeners, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_option = _this.root.find('.disclosure--current-option');
      _this.form = _this.root.find('.disclosure--form');
      _this.input = _this.root.find('[data-item="disclosure"]');
      _this.links = _this.root.find('.disclosure--option-link');
      _this.toggle = _this.root.find('.disclosure--toggle');
      _this.type = _this.root.attr('data-type');
      _this.toggle_and_form_gap = 8;
      _this.window_and_form_gap = 32;
      _this.form_space_needed = theme.utils.getHiddenElHeight(_this.form, false) + _this.toggle_and_form_gap + _this.window_and_form_gap;
      _this.load();
    }

    CoreDisclosure.prototype.load = function() {
      var _this;
      _this = this;
      _this.updateFormListeners();
      _this.showFormWhenClick();
      _this.hideFormWhenFocusOut();
      _this.setOptionOnClick();
      _this.updateFormPosition();
      if (_this.type === 'url-redirect' || _this.type === 'localization') {
        return _this.optionChangeCallback();
      }
    };

    CoreDisclosure.prototype.updateFormListeners = function() {
      var _this;
      _this = this;
      window.addEventListener('resize', theme.utils.debounce(100, function() {
        return _this.updateFormPosition();
      }));
      window.addEventListener('theme:offCanvas:leftOpened', function() {
        if (_this.root.closest('.off-canvas--left-sidebar').length) {
          return _this.updateFormPosition();
        }
      });
      return window.addEventListener('theme:offCanvas:rightOpened', function() {
        if (_this.root.closest('.off-canvas--right-sidebar').length) {
          return _this.updateFormPosition();
        }
      });
    };

    CoreDisclosure.prototype.showFormWhenClick = function() {
      var _this;
      _this = this;
      return _this.toggle.on('click keydown', function(event) {
        var aria_expanded;
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        aria_expanded = this.getAttribute('aria-expanded') === 'true';
        return _this.toggleFormDisplay(!aria_expanded);
      });
    };

    CoreDisclosure.prototype.hideFormWhenFocusOut = function() {
      var _this;
      _this = this;
      _this.toggle.on('focusout', function(event) {
        var form_has_focus;
        form_has_focus = _this.root.has(event.relatedTarget);
        if (!form_has_focus) {
          return _this.toggleFormDisplay(false);
        }
      });
      _this.form.on('focusout', function(event) {
        var child_in_focus, is_visible;
        child_in_focus = this.contains(event.relatedTarget);
        is_visible = _this.toggle.attr('aria-expanded') === 'true';
        if (is_visible && !child_in_focus) {
          return _this.toggleFormDisplay(false);
        }
      });
      return _this.root.on('keydown', function(event) {
        if (event.key !== "Escape") {
          return;
        }
        _this.toggleFormDisplay(false);
        return _this.toggle.focus();
      });
    };

    CoreDisclosure.prototype.setOptionOnClick = function() {
      var _this;
      _this = this;
      return _this.links.on('click keydown', function(event) {
        var option_selected_name, option_selected_value;
        if (event.key === 'Enter') {
          _this.toggle.focus();
        } else if (event.type === 'keydown') {
          return;
        }
        option_selected_value = this.dataset.value;
        option_selected_name = this.innerHTML;
        _this.toggleFormDisplay(false);
        _this.current_option.html(option_selected_name);
        _this.links.attr('aria-current', false);
        this.setAttribute('aria-current', true);
        _this.input.val(option_selected_value);
        return _this.input.trigger('change');
      });
    };

    CoreDisclosure.prototype.toggleFormDisplay = function(open_form) {
      var _this;
      _this = this;
      return _this.toggle.attr('aria-expanded', open_form);
    };

    CoreDisclosure.prototype.updateFormPosition = function() {
      var _this, clearance_height, close_to_bottom, close_to_top, distance_from_bottom, distance_from_top, form_height, height_of_canvas, height_of_toggle, max_form_height;
      _this = this;
      height_of_toggle = _this.toggle.outerHeight();
      clearance_height = height_of_toggle + _this.toggle_and_form_gap;
      height_of_canvas = _this.root.closest('[class^=off-canvas]').height();
      distance_from_top = _this.root.offset().top;
      distance_from_bottom = height_of_canvas - distance_from_top - height_of_toggle;
      close_to_bottom = (_this.form_space_needed > distance_from_bottom) && (distance_from_bottom < distance_from_top);
      close_to_top = (_this.form_space_needed > distance_from_top) && (distance_from_bottom > distance_from_top);
      max_form_height = window.innerHeight - clearance_height - _this.window_and_form_gap;
      if (close_to_bottom) {
        max_form_height -= distance_from_bottom;
      } else if (close_to_top) {
        max_form_height -= distance_from_top;
      }
      _this.form.css('max-height', max_form_height + "px");
      if (close_to_bottom) {
        form_height = theme.utils.getHiddenElHeight(_this.form, false) + _this.toggle_and_form_gap;
        return _this.form.css('top', "-" + form_height + "px");
      } else {
        return _this.form.css('top', clearance_height + "px");
      }
    };

    CoreDisclosure.prototype.optionChangeCallback = function() {
      var _this;
      _this = this;
      return _this.input.on('change', function() {
        if (_this.type === 'url-redirect') {
          return window.location.href = this.value;
        } else if (_this.type === 'localization') {
          return this.closest('form').submit();
        }
      });
    };

    return CoreDisclosure;

  })();

  theme.classes.CoreDomObject = (function() {
    function CoreDomObject(selector1, container1) {
      var event_function_map;
      this.selector = selector1;
      this.container = container1 != null ? container1 : document;
      this.wrapInner = bind(this.wrapInner, this);
      this.wrapAll = bind(this.wrapAll, this);
      this.width = bind(this.width, this);
      this.val = bind(this.val, this);
      this.trigger = bind(this.trigger, this);
      this.text = bind(this.text, this);
      this.submit = bind(this.submit, this);
      this.siblings = bind(this.siblings, this);
      this.show = bind(this.show, this);
      this.setAttribute = bind(this.setAttribute, this);
      this.scrollTop = bind(this.scrollTop, this);
      this.replaceWith = bind(this.replaceWith, this);
      this.removeClass = bind(this.removeClass, this);
      this.removeAttr = bind(this.removeAttr, this);
      this.remove = bind(this.remove, this);
      this.prev = bind(this.prev, this);
      this.prepend = bind(this.prepend, this);
      this.parent = bind(this.parent, this);
      this.outerWidth = bind(this.outerWidth, this);
      this.outerHtml = bind(this.outerHtml, this);
      this.outerHeight = bind(this.outerHeight, this);
      this.on = bind(this.on, this);
      this.offset = bind(this.offset, this);
      this.off = bind(this.off, this);
      this.not = bind(this.not, this);
      this.next = bind(this.next, this);
      this.last = bind(this.last, this);
      this.isEmpty = bind(this.isEmpty, this);
      this.isVisible = bind(this.isVisible, this);
      this.is = bind(this.is, this);
      this.insertBefore = bind(this.insertBefore, this);
      this.index = bind(this.index, this);
      this.html = bind(this.html, this);
      this.hide = bind(this.hide, this);
      this.height = bind(this.height, this);
      this.hasClass = bind(this.hasClass, this);
      this.has = bind(this.has, this);
      this.getAttribute = bind(this.getAttribute, this);
      this.focus = bind(this.focus, this);
      this.first = bind(this.first, this);
      this.find = bind(this.find, this);
      this.filter = bind(this.filter, this);
      this.eq = bind(this.eq, this);
      this.empty = bind(this.empty, this);
      this.each = bind(this.each, this);
      this.data = bind(this.data, this);
      this.css = bind(this.css, this);
      this.closest = bind(this.closest, this);
      this.clone = bind(this.clone, this);
      this.children = bind(this.children, this);
      this.attr = bind(this.attr, this);
      this.append = bind(this.append, this);
      this.addClass = bind(this.addClass, this);
      this.add = bind(this.add, this);
      if ((typeof this.selector) === 'string') {
        this.el = this.container.querySelectorAll(this.selector);
      } else if (Array.isArray(this.selector)) {
        this.el = this.selector;
      } else if ((typeof this.selector) === 'object') {
        this.el = new Array(this.selector);
      } else {
        this.el = [];
      }
      this.isDOMobject = true;
      if (this.el[0] !== null) {
        this.length = this.el.length;
      } else {
        this.length = 0;
      }
      event_function_map = [];
      this.el.forEach(function(el) {
        return event_function_map.push({});
      });
      this.event_function_map = event_function_map;
    }

    CoreDomObject.prototype.add = function(element) {
      var elements_to_add;
      if ((typeof element) === 'string') {
        elements_to_add = Array.from(document.querySelectorAll(element.selector));
      } else {
        elements_to_add = Array.from(element.el);
      }
      this.el.forEach(function(el) {
        return elements_to_add.push(el);
      });
      return el(elements_to_add);
    };

    CoreDomObject.prototype.addClass = function(class_name) {
      if (!class_name) {
        return false;
      }
      this.el.forEach(function(el) {
        return el.classList.add(class_name);
      });
      return this;
    };

    CoreDomObject.prototype.append = function(element) {
      if (typeof element === 'object' && this.length && element.length) {
        this.el.forEach(function(parent_el) {
          return element.el.forEach(function(child_el) {
            return parent_el.appendChild(child_el);
          });
        });
      }
      return this;
    };

    CoreDomObject.prototype.attr = function(attr, val) {
      if (attr == null) {
        attr = null;
      }
      if (val == null) {
        val = null;
      }
      if (!attr) {
        return;
      }
      if (val !== null && this.length) {
        this.el.forEach(function(el) {
          return el.setAttribute(attr, val);
        });
        return this;
      } else if (this.length) {
        return this.el[0].getAttribute(attr);
      }
    };

    CoreDomObject.prototype.children = function(selector) {
      if (!selector) {
        selector = '*';
      }
      return el(":scope > " + selector, this.el[0]);
    };

    CoreDomObject.prototype.clone = function() {
      if (this.length === 0) {
        return;
      }
      return el(this.el[0].cloneNode(true));
    };

    CoreDomObject.prototype.closest = function(selector) {
      if (!(selector && this.length)) {
        return false;
      }
      return el(this.el[0].closest(selector));
    };

    CoreDomObject.prototype.css = function(property_name, value) {
      if (!(property_name || value)) {
        return false;
      } else if (value === void 0 && this.length) {
        return window.getComputedStyle(this.el[0])[property_name];
      } else {
        this.el.forEach(function(el) {
          return el.style[property_name] = value;
        });
      }
      return this;
    };

    CoreDomObject.prototype.data = function(data_attr) {
      var attr;
      if (!(data_attr && this.length)) {
        return false;
      }
      if (!(data_attr.indexOf('-') > -1)) {
        data_attr = (data_attr.match(/[A-Za-z][a-z]*/g) || {}).join('-');
      }
      attr = this.el[0].getAttribute("data-" + data_attr);
      if (attr === 'true') {
        return true;
      } else if (attr === 'false') {
        return false;
      } else if (isNaN(parseFloat(attr))) {
        return attr;
      } else {
        return parseFloat(attr);
      }
    };

    CoreDomObject.prototype.each = function(callback) {
      return this.el.forEach(function(el, index) {
        return callback(el, index);
      });
    };

    CoreDomObject.prototype.empty = function() {
      if (this.length) {
        this.el.forEach(function(el) {
          return el.innerHTML = '';
        });
      }
      return this;
    };

    CoreDomObject.prototype.eq = function(index) {
      if (index === void 0) {
        return -1;
      }
      return el(this.el[index]);
    };

    CoreDomObject.prototype.filter = function(selector) {
      var elements_to_filter, new_element_list;
      if (!selector) {
        return false;
      }
      elements_to_filter = Array.from(this.container.querySelectorAll(selector));
      new_element_list = [];
      this.el.forEach(function(el) {
        if (elements_to_filter.includes(el)) {
          return new_element_list.push(el);
        }
      });
      return el(new_element_list);
    };

    CoreDomObject.prototype.find = function(selector) {
      var new_elements;
      if (!selector) {
        return false;
      } else if (selector.charAt(0) === '>') {
        selector = ":scope " + selector;
      }
      if (this.length === 1) {
        return el(selector, this.el[0]);
      } else {
        new_elements = [];
        this.el.forEach(function(el) {
          var found_element, found_elements, j, len, results1;
          found_elements = el.querySelectorAll(selector);
          results1 = [];
          for (j = 0, len = found_elements.length; j < len; j++) {
            found_element = found_elements[j];
            results1.push(new_elements.push(found_element));
          }
          return results1;
        });
        return el(new_elements);
      }
    };

    CoreDomObject.prototype.first = function() {
      return el(this.el[0]);
    };

    CoreDomObject.prototype.focus = function(index) {
      if (index == null) {
        index = null;
      }
      if (index === null) {
        index = 0;
      }
      if (this.length) {
        this.el[index].focus();
      }
      return this;
    };

    CoreDomObject.prototype.getAttribute = function(attr) {
      if (!(attr && this.length)) {
        return;
      }
      return this.el[0].getAttribute(attr);
    };

    CoreDomObject.prototype.has = function(element) {
      if (typeof element === 'object') {
        return this.el[0].contains(element);
      } else {

      }
    };

    CoreDomObject.prototype.hasClass = function(class_name) {
      if (!(class_name && this.length)) {
        return;
      }
      return this.el[0].classList.contains(class_name);
    };

    CoreDomObject.prototype.height = function(height) {
      if (height == null) {
        height = null;
      }
      if (this.length === 0) {
        return this;
      }
      if (height === null) {
        return this.el[0].offsetHeight;
      } else {
        this.el.forEach(function(el) {
          return el.style.height = height + "px";
        });
        return this;
      }
    };

    CoreDomObject.prototype.hide = function() {
      if (this.length === 0) {
        return;
      }
      this.el.forEach(function(el) {
        return el.style.display = "none";
      });
      return this;
    };

    CoreDomObject.prototype.html = function(html) {
      if (!html) {
        return this.el[0].innerHTML;
      } else if (this.length) {
        this.el[0].innerHTML = html;
      }
      return this;
    };

    CoreDomObject.prototype.index = function(element) {
      var found_index;
      if (element == null) {
        element = null;
      }
      if (element === null) {
        return Array.from(this.el[0].parentNode.children).indexOf(this.el[0]);
      } else {
        found_index = -1;
        this.el.forEach(function(el, index) {
          if (el === element.el[0]) {
            return found_index = index;
          }
        });
        return found_index;
      }
    };

    CoreDomObject.prototype.insertBefore = function(new_el) {
      if (this.length === 0) {
        return;
      }
      this.el.forEach(function(el) {
        return el.parentNode.insertBefore(new_el.el[0], el);
      });
      return this;
    };

    CoreDomObject.prototype.is = function(element) {
      var elements_to_compare;
      if (element == null) {
        element = null;
      }
      if (element === null) {
        return false;
      } else if ((typeof element) === 'string') {
        elements_to_compare = Array.from(document.querySelectorAll(element));
      } else {
        elements_to_compare = Array.from(element.el);
      }
      return elements_to_compare.includes(this.el[0]);
    };

    CoreDomObject.prototype.isVisible = function() {
      var is_visible;
      if (this.length === 0) {
        return;
      }
      is_visible = false;
      this.el.forEach(function(el) {
        var style;
        style = window.getComputedStyle(el);
        if (style.display !== 'none') {
          return is_visible = true;
        }
      });
      return is_visible;
    };

    CoreDomObject.prototype.isEmpty = function() {
      var is_empty;
      if (this.length === 0) {
        return;
      }
      is_empty = true;
      this.el.forEach(function(el) {
        if (el.hasChildNodes()) {
          is_empty = false;
        }
      });
      return is_empty;
    };

    CoreDomObject.prototype.last = function() {
      if (this.length === 0) {
        return;
      }
      return el(this.el[this.el.length - 1], this.container);
    };

    CoreDomObject.prototype.next = function() {
      if (this.length === 0) {
        return;
      }
      return el(this.el[0].nextElementSibling);
    };

    CoreDomObject.prototype.not = function(element) {
      var elements_to_remove, new_object_arr;
      if ((typeof element) === 'string') {
        elements_to_remove = Array.from(document.querySelectorAll(element));
      } else {
        elements_to_remove = Array.from(element.el);
      }
      new_object_arr = [];
      this.el.forEach(function(el) {
        if (!(elements_to_remove.includes(el) || new_object_arr.includes(el))) {
          return new_object_arr.push(el);
        }
      });
      return el(new_object_arr);
    };

    CoreDomObject.prototype.off = function(types) {
      var event_function_map;
      if (this.length === 0) {
        return;
      }
      event_function_map = this.event_function_map;
      this.el.forEach(function(el, el_index) {
        return types.split(' ').forEach(function(type) {
          if (event_function_map[el_index][type]) {
            el.removeEventListener(type.split('.')[0], event_function_map[el_index][type]);
            return delete event_function_map[el_index][type];
          }
        });
      });
      this.event_function_map = event_function_map;
      return true;
    };

    CoreDomObject.prototype.offset = function() {
      var offset, rect;
      if (this.length === 0) {
        return;
      }
      rect = this.el[0].getBoundingClientRect();
      return offset = {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset
      };
    };

    CoreDomObject.prototype.on = function(types, event_function, passive) {
      var event_function_map;
      if (passive == null) {
        passive = false;
      }
      if (this.length === 0) {
        return;
      }
      event_function_map = this.event_function_map;
      this.el.forEach(function(el, el_index) {
        return types.split(' ').forEach(function(type) {
          event_function_map[el_index][type] = event_function;
          return el.addEventListener(type.split('.')[0], event_function, {
            passive: passive
          });
        });
      });
      this.event_function_map = event_function_map;
      return true;
    };

    CoreDomObject.prototype.outerHeight = function() {
      if (this.length) {
        return this.el[0].offsetHeight;
      }
    };

    CoreDomObject.prototype.outerHtml = function() {
      if (this.length) {
        return this.el[0].outerHTML;
      }
    };

    CoreDomObject.prototype.outerWidth = function() {
      if (this.length) {
        return this.el[0].offsetWidth;
      }
    };

    CoreDomObject.prototype.parent = function() {
      var parent_el;
      if (this.length) {
        parent_el = [];
        this.el.forEach(function(child) {
          return parent_el.push(child.parentNode);
        });
        return el(parent_el);
      } else {
        return this;
      }
    };

    CoreDomObject.prototype.prepend = function(element) {
      if (typeof element === 'object' && this.length && element.length) {
        this.el.forEach(function(parent_el) {
          return element.el.forEach(function(child_el) {
            return parent_el.prepend(child_el);
          });
        });
      }
      return this;
    };

    CoreDomObject.prototype.prev = function() {
      if (this.length === 0) {
        return;
      }
      return el(this.el[0].previousElementSibling);
    };

    CoreDomObject.prototype.remove = function() {
      this.el.forEach(function(el) {
        return el.parentNode.removeChild(el);
      });
      return delete this;
    };

    CoreDomObject.prototype.removeAttr = function(attr) {
      if (attr == null) {
        attr = null;
      }
      if (attr === null) {
        return;
      }
      if (this.length) {
        this.el.forEach(function(el) {
          return el.removeAttribute(attr);
        });
      }
      return this;
    };

    CoreDomObject.prototype.removeClass = function(class_names) {
      if (!(class_names && this.length)) {
        return;
      }
      this.el.forEach(function(el) {
        return class_names.split(' ').forEach(function(class_name) {
          return el.classList.remove(class_name);
        });
      });
      return this;
    };

    CoreDomObject.prototype.replaceWith = function(element) {
      if (this.length) {
        this.el[0].replaceWith(element.el[0]);
      }
      return this;
    };

    CoreDomObject.prototype.scrollTop = function(position) {
      if (this.length === 0) {
        return;
      }
      if (position) {
        return this.el[0].scrollTop = position;
      } else {
        return this.el[0].scrollTop;
      }
    };

    CoreDomObject.prototype.setAttribute = function(attribute, value) {
      if (!(attribute || value)) {
        return;
      }
      if (this.length) {
        this.el.forEach(function(el) {
          return el.setAttribute(attribute, value);
        });
        return this;
      }
    };

    CoreDomObject.prototype.show = function() {
      if (this.length === 0) {
        return;
      }
      this.el.forEach(function(el) {
        return el.style.display = "block";
      });
      return this;
    };

    CoreDomObject.prototype.siblings = function(selector) {
      if (this.length === 0) {
        return;
      }
      return el(selector, this.el[0].parentNode);
    };

    CoreDomObject.prototype.submit = function() {
      if (this.length === 0) {
        return;
      }
      return this.el[0].submit();
    };

    CoreDomObject.prototype.text = function(text) {
      if (text == null) {
        text = null;
      }
      if (this.length === 0) {
        return this;
      }
      if (text === null) {
        return this.el[0].textContent;
      } else {
        this.el.forEach(function(el) {
          return el.textContent = text;
        });
      }
      return this;
    };

    CoreDomObject.prototype.trigger = function(types) {
      var elements;
      if (!types) {
        return;
      }
      elements = this.el;
      types.split(" ").forEach(function(type) {
        var event;
        event = new Event(type.split(".")[0], {
          "bubbles": true
        });
        return elements.forEach(function(el) {
          return el.dispatchEvent(event);
        });
      });
      return this;
    };

    CoreDomObject.prototype.val = function(new_value) {
      if (new_value == null) {
        new_value = null;
      }
      if (this.length === 0) {
        return;
      }
      if (new_value === null) {
        return this.el[0].value;
      } else {
        this.el[0].value = new_value;
      }
      return this;
    };

    CoreDomObject.prototype.width = function(width) {
      if (width == null) {
        width = null;
      }
      if (this.length === 0) {
        return;
      }
      if (width === null) {
        return this.el[0].offsetWidth;
      } else {
        return this.el.forEach(function(el) {
          return el.style.width = width + "px";
        });
      }
    };

    CoreDomObject.prototype.wrapAll = function(prepended_html, appended_html) {
      if (this.length === 0) {
        return;
      }
      this.el.forEach(function(el) {
        var new_html, org_html;
        org_html = el.outerHTML;
        new_html = prepended_html + org_html + appended_html;
        return el.outerHTML = new_html;
      });
      return this;
    };

    CoreDomObject.prototype.wrapInner = function(prepended_html, appended_html) {
      if (this.length === 0) {
        return;
      }
      this.el.forEach(function(el) {
        var new_html, org_html;
        org_html = el.innerHTML;
        new_html = prepended_html + org_html + appended_html;
        return el.innerHTML = new_html;
      });
      return this;
    };

    return CoreDomObject;

  })();

  theme.classes.CoreFeaturedBlog = (function() {
    function CoreFeaturedBlog(root) {
      var _this;
      this.root = root;
      this.resizeListeners = bind(this.resizeListeners, this);
      this.matchImageHeights = bind(this.matchImageHeights, this);
      _this = this;
      _this.current_width = window.innerWidth;
      _this.item_container = _this.root.find('.featured-blog--grid');
      _this.items = _this.root.find('.article--item');
      _this.matchImageHeights();
      _this.resizeListeners();
    }

    CoreFeaturedBlog.prototype.matchImageHeights = function() {
      var _this;
      _this = this;
      return theme.utils.matchImageHeights(_this.item_container, _this.items, '.article--item--image');
    };

    CoreFeaturedBlog.prototype.resizeListeners = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.FeaturedBlog', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.matchImageHeights();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    return CoreFeaturedBlog;

  })();

  theme.classes.CoreFeaturedCollection = (function() {
    function CoreFeaturedCollection(root) {
      var _this;
      this.root = root;
      this.hoverImagesLoaded = bind(this.hoverImagesLoaded, this);
      this.setGreatestHeight = bind(this.setGreatestHeight, this);
      this.sectionListeners = bind(this.sectionListeners, this);
      this.resizeListener = bind(this.resizeListener, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_width = window.innerWidth;
      _this.display_type = _this.root.data('display-type');
      _this.section_id = _this.root.data('section-id');
      _this.items = _this.root.find('.product--root');
      _this.load();
    }

    CoreFeaturedCollection.prototype.load = function() {
      var _this;
      _this = this;
      _this.resizeListener();
      _this.sectionListeners();
      _this.setGreatestHeight();
      if (theme.settings.hover_image_enabled) {
        return _this.hoverImagesLoaded();
      }
    };

    CoreFeaturedCollection.prototype.resizeListener = function() {
      var _this;
      _this = this;
      return theme.window.on("resize." + _this.section_id, theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.setGreatestHeight();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    CoreFeaturedCollection.prototype.sectionListeners = function() {
      var _this;
      _this = this;
      return _this.root.on('theme:section:unload', function() {
        return theme.window.off("resize." + _this.section_id);
      });
    };

    CoreFeaturedCollection.prototype.setGreatestHeight = function() {
      var _this, greatest_image_height;
      _this = this;
      if (_this.display_type === 'grid') {
        return theme.utils.matchImageHeights(_this.root.find('.featured-collection--grid'), _this.root.find('.product--root'), '.product--image-wrapper');
      } else {
        greatest_image_height = 0;
        _this.items.each(function(item) {
          var item_el, this_height;
          item_el = el(item);
          if (item_el.find('.image--root').length > 0) {
            this_height = item_el.find('.product--image-wrapper .image--root').outerHeight();
          } else {
            this_height = item_el.find('.placeholder--root').outerHeight();
          }
          if (this_height > greatest_image_height) {
            return greatest_image_height = this_height;
          }
        });
        return _this.items.find('.product--image-wrapper, .placeholder--root').height(greatest_image_height);
      }
    };

    CoreFeaturedCollection.prototype.hoverImagesLoaded = function() {
      var _this;
      _this = this;
      return _this.root.find('.product--hover-image').each(function(hover_image) {
        return theme.utils.imagesLoaded(hover_image, function() {
          var product;
          product = hover_image.closest('[data-hover-image="true"]');
          return product.setAttribute('data-hover-image', 'loaded');
        });
      });
    };

    return CoreFeaturedCollection;

  })();

  theme.classes.CoreFeaturedCollections = (function() {
    function CoreFeaturedCollections(root) {
      var _this;
      this.root = root;
      this.resizeListeners = bind(this.resizeListeners, this);
      this.matchImageHeights = bind(this.matchImageHeights, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_width = window.innerWidth;
      _this.item_container = _this.root.find('.featured-collections--body');
      _this.items = _this.root.find('.featured-collections--item');
      _this.load();
    }

    CoreFeaturedCollections.prototype.load = function() {
      var _this;
      _this = this;
      _this.matchImageHeights();
      return _this.resizeListeners();
    };

    CoreFeaturedCollections.prototype.matchImageHeights = function() {
      var _this;
      _this = this;
      return theme.utils.matchImageHeights(_this.item_container, _this.items, '.featured-collections--image');
    };

    CoreFeaturedCollections.prototype.resizeListeners = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.FeaturedCollections', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.matchImageHeights();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    return CoreFeaturedCollections;

  })();

  theme.classes.CoreFeaturedGrid = (function() {
    function CoreFeaturedGrid(root) {
      var _this;
      this.root = root;
      this.resizeListeners = bind(this.resizeListeners, this);
      this.matchImageHeights = bind(this.matchImageHeights, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_width = window.innerWidth;
      _this.item_container = _this.root.find('.featured-grid--body--container');
      _this.items = _this.root.find('.featured-grid--item');
      _this.text_position = _this.root.attr('data-text-position');
      _this.mobile_overlay = _this.root.data('mobile-overlay');
      _this.load();
    }

    CoreFeaturedGrid.prototype.load = function() {
      var _this;
      _this = this;
      _this.matchImageHeights();
      return _this.resizeListeners();
    };

    CoreFeaturedGrid.prototype.matchImageHeights = function() {
      var _this;
      _this = this;
      if (_this.text_position === 'bottom' || (theme.utils.mqs.current_window === 'small' && !_this.mobile_overlay)) {
        return theme.utils.matchImageHeights(_this.item_container, _this.items, '.featured-grid--item--image');
      }
    };

    CoreFeaturedGrid.prototype.resizeListeners = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.FeaturedGrid', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.matchImageHeights();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    return CoreFeaturedGrid;

  })();

  theme.classes.CoreFeaturedVideo = (function() {
    function CoreFeaturedVideo(root) {
      var _this;
      this.root = root;
      this.hideThumbnail = bind(this.hideThumbnail, this);
      this.playButtonListener = bind(this.playButtonListener, this);
      this.disablePlayerFocus = bind(this.disablePlayerFocus, this);
      this.vimeoEvents = bind(this.vimeoEvents, this);
      this.insertVimeoPlayer = bind(this.insertVimeoPlayer, this);
      this.youtubeEvents = bind(this.youtubeEvents, this);
      this.youtubeReady = bind(this.youtubeReady, this);
      this.insertYoutubePlayer = bind(this.insertYoutubePlayer, this);
      this.insertAPIScript = bind(this.insertAPIScript, this);
      this.playerInit = bind(this.playerInit, this);
      this.checkAPIScriptExists = bind(this.checkAPIScriptExists, this);
      _this = this;
      _this.play_buttons = _this.root.find('.featured-video--play svg, .featured-video--play-mobile svg');
      _this.section_id = _this.root.attr('data-section-id');
      _this.thumbnail = _this.root.data('thumbnail');
      _this.video_type = _this.root.attr('data-video-type');
      _this.video_id = _this.root.attr('data-video-id');
      _this.vimeo_vars = {
        id: _this.video_id,
        autopause: 0,
        playsinline: 0,
        title: 0
      };
      _this.youtube_vars = {};
      if (_this.thumbnail) {
        _this.playButtonListener();
      } else {
        _this.checkAPIScriptExists();
      }
    }

    CoreFeaturedVideo.prototype.checkAPIScriptExists = function() {
      var _this;
      _this = this;
      if (_this.video_type === 'vimeo') {
        if (theme.libraries.vimeo) {
          return _this.playerInit();
        } else {
          return _this.insertAPIScript();
        }
      } else {
        if (theme.libraries.youtube) {
          return _this.playerInit();
        } else {
          return _this.insertAPIScript();
        }
      }
    };

    CoreFeaturedVideo.prototype.playerInit = function() {
      var _this;
      _this = this;
      if (_this.video_type === 'vimeo') {
        if (_this.thumbnail) {
          return _this.insertVimeoPlayer();
        } else {
          window.addEventListener('load', function() {
            return _this.insertVimeoPlayer();
          });
          return _this.root.on('theme:section:load', function() {
            return _this.insertVimeoPlayer();
          });
        }
      } else {
        if (_this.thumbnail) {
          return _this.insertYoutubePlayer();
        } else {
          window.addEventListener('load', function() {
            return _this.insertYoutubePlayer();
          });
          return _this.root.on('theme:section:load', function() {
            return _this.insertYoutubePlayer();
          });
        }
      }
    };

    CoreFeaturedVideo.prototype.insertAPIScript = function() {
      var _this;
      _this = this;
      if (_this.video_type === 'vimeo') {
        return libraryLoader('vimeo', 'https://player.vimeo.com/api/player.js', function() {
          return _this.insertVimeoPlayer();
        });
      } else {
        libraryLoader('youtube', 'https://www.youtube.com/iframe_api');
        return window.addEventListener('theme:utils:youtubeAPIReady', function() {
          return _this.insertYoutubePlayer();
        });
      }
    };

    CoreFeaturedVideo.prototype.insertYoutubePlayer = function() {
      var _this;
      _this = this;
      if (!_this.thumbnail) {
        _this.youtube_vars.enablejsapi = 1;
        _this.youtube_vars.origin = window.location.href;
        _this.youtube_vars.playsinline = 1;
        _this.youtube_vars.fs = 0;
        _this.youtube_vars.loop = 1;
        _this.youtube_vars.playlist = _this.video_id;
      }
      if (typeof YT !== 'undefined') {
        return _this.player = new YT.Player("player-" + _this.section_id, {
          videoId: _this.video_id,
          playerVars: _this.youtube_vars,
          events: {
            'onReady': _this.youtubeReady,
            'onStateChange': _this.youtubeEvents
          }
        });
      }
    };

    CoreFeaturedVideo.prototype.youtubeReady = function() {
      var _this;
      _this = this;
      if (!_this.thumbnail) {
        _this.player.mute();
        _this.disablePlayerFocus();
      }
      return _this.player.playVideo();
    };

    CoreFeaturedVideo.prototype.youtubeEvents = function(event) {
      var YTP, _this, remains;
      _this = this;
      YTP = event.target;
      if (_this.thumbnail) {
        if (event.data === 0) {
          YTP.seekTo(0);
          return YTP.pauseVideo();
        }
      } else {
        if (event.data === 1) {
          remains = YTP.getDuration() - YTP.getCurrentTime();
          if (_this.rewindTO) {
            clearTimeout(_this.rewindTO);
          }
          return _this.rewindTO = setTimeout(function() {
            YTP.seekTo(0);
          }, (remains - 0.1) * 1000);
        }
      }
    };

    CoreFeaturedVideo.prototype.insertVimeoPlayer = function() {
      var _this;
      _this = this;
      if (!_this.thumbnail) {
        _this.vimeo_vars.playsinline = 1;
        _this.vimeo_vars.muted = 1;
        _this.vimeo_vars.background = 1;
        _this.vimeo_vars.loop = 1;
      }
      _this.player = new Vimeo.Player("player-" + _this.section_id, _this.vimeo_vars);
      if (_this.thumbnail) {
        _this.vimeoEvents();
      } else {
        _this.player.ready().then(function() {
          return _this.disablePlayerFocus();
        });
      }
      return _this.player.play();
    };

    CoreFeaturedVideo.prototype.vimeoEvents = function() {
      var _this;
      _this = this;
      _this.player.getDuration().then(function(duration) {
        return _this.player.addCuePoint(duration - 0.3, {});
      });
      return _this.player.on('cuepoint', function() {
        _this.player.setCurrentTime(0);
        return _this.player.pause();
      });
    };

    CoreFeaturedVideo.prototype.disablePlayerFocus = function() {
      var _this;
      _this = this;
      return _this.root.find('iframe').attr('tabindex', '-1');
    };

    CoreFeaturedVideo.prototype.playButtonListener = function() {
      var _this;
      _this = this;
      _this.play_buttons.attr('tabindex', '0');
      return _this.play_buttons.on('click keydown', function(event) {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        _this.checkAPIScriptExists();
        return _this.hideThumbnail();
      });
    };

    CoreFeaturedVideo.prototype.hideThumbnail = function() {
      var _this;
      _this = this;
      return setTimeout(function() {
        return _this.root.find('.featured-video--header, .featured-video--thumbnail, .featured-video--play-mobile').hide();
      }, 350);
    };

    return CoreFeaturedVideo;

  })();

  theme.classes.CoreFeedbackBar = (function() {
    function CoreFeedbackBar(root) {
      var _this;
      this.root = root;
      this.asyncListener = bind(this.asyncListener, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.messages = _this.root.find('.feedback-bar--message > *');
      _this.load();
      _this.asyncListener();
    }

    CoreFeedbackBar.prototype.load = function() {
      var _this, anchor_tag, message, message_elem;
      _this = this;
      _this.messages.hide();
      anchor_tag = window.location.hash.substr(1);
      message = anchor_tag.replace('feedback-bar--', '');
      message_elem = _this.messages.filter("[data-message='" + message + "']");
      if (message_elem.length) {
        message_elem.show();
        setTimeout(function() {
          return _this.root.attr('data-open', 'true');
        }, 200);
        return setTimeout(function() {
          return _this.root.attr('data-open', 'false');
        }, 5000);
      }
    };

    CoreFeedbackBar.prototype.asyncListener = function() {
      var _this;
      _this = this;
      return window.addEventListener('theme:feedbackBar:trigger', function() {
        return _this.load();
      });
    };

    return CoreFeedbackBar;

  })();

  theme.classes.CoreFooter = (function() {
    function CoreFooter(root) {
      var _this;
      this.root = root;
      this.stickyFooter = bind(this.stickyFooter, this);
      this.addListeners = bind(this.addListeners, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.header = el('.header--root');
      _this.main_content = el('.layout--main-content');
      _this.load();
    }

    CoreFooter.prototype.load = function() {
      var _this;
      _this = this;
      _this.addListeners();
      return _this.stickyFooter();
    };

    CoreFooter.prototype.addListeners = function() {
      var _this;
      _this = this;
      theme.window.on('resize theme:cart:updated', function() {
        return _this.stickyFooter();
      });
      return document.addEventListener('shopify:section:load', function() {
        return _this.stickyFooter();
      });
    };

    CoreFooter.prototype.stickyFooter = function() {
      var _this, announcement_el, reduce_window_by, total_content_height;
      _this = this;
      _this.main_content.css('min-height', 'unset');
      total_content_height = _this.header.outerHeight() + _this.main_content.outerHeight() + _this.root.outerHeight();
      if (theme.body.data('border')) {
        if (theme.utils.mqs.current_window === 'small') {
          total_content_height += 8 * 2;
        } else {
          total_content_height += 12 * 2;
        }
      }
      announcement_el = el('.announcement--root');
      if (announcement_el.length > 0) {
        total_content_height += announcement_el.outerHeight();
      }
      if (window.innerHeight > total_content_height) {
        reduce_window_by = total_content_height - _this.main_content.outerHeight();
        return _this.main_content.css('min-height', (window.innerHeight - reduce_window_by) + "px");
      }
    };

    return CoreFooter;

  })();

  theme.classes.CoreListCollections = (function() {
    function CoreListCollections(root) {
      var _this;
      this.root = root;
      this.resizeListener = bind(this.resizeListener, this);
      this.matchImageHeights = bind(this.matchImageHeights, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_width = window.innerWidth;
      _this.item_containers = _this.root.find('.list-collections--grid');
      _this.load();
    }

    CoreListCollections.prototype.load = function() {
      var _this;
      _this = this;
      _this.resizeListener();
      return _this.matchImageHeights();
    };

    CoreListCollections.prototype.matchImageHeights = function() {
      var _this;
      _this = this;
      return _this.item_containers.each(function(container) {
        var container_el;
        container_el = el(container);
        return theme.utils.matchImageHeights(container_el, container_el.find('.product--root'), '.product--image-wrapper');
      });
    };

    CoreListCollections.prototype.resizeListener = function() {
      var _this;
      _this = this;
      return window.addEventListener('resize', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.matchImageHeights();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    return CoreListCollections;

  })();

  theme.classes.CoreMap = (function() {
    function CoreMap(root) {
      var _this;
      this.root = root;
      this.buildStyles = bind(this.buildStyles, this);
      this.buildMap = bind(this.buildMap, this);
      this.geolocate = bind(this.geolocate, this);
      this.loadMapsApi = bind(this.loadMapsApi, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.api_status = null;
      _this.map_instance = null;
      _this.key = _this.root.data('api-key');
      _this.address = _this.root.attr('data-address');
      _this.theme = _this.root.data('theme');
      _this.styles = null;
      _this.container = _this.root.find('.map--google-maps');
      _this.center = null;
      _this.load();
    }

    CoreMap.prototype.load = function() {
      var _this;
      _this = this;
      if (_this.container.length > 0) {
        return _this.loadMapsApi();
      }
    };

    CoreMap.prototype.loadMapsApi = function() {
      var _this;
      _this = this;
      if (theme.libraries.google_maps === void 0) {
        return libraryLoader('google_maps', "https://maps.googleapis.com/maps/api/js?key=" + _this.key, function() {
          _this.geolocate();
          return el('.map--root').not(_this.root).trigger('scriptLoaded');
        });
      } else if (theme.libraries.google_maps === 'requested') {
        return _this.root.on('scriptLoaded', function() {
          return _this.geolocate();
        });
      } else if (theme.libraries.google_maps === 'loaded') {
        return _this.geolocate();
      }
    };

    CoreMap.prototype.geolocate = function() {
      var _this, geocoder;
      _this = this;
      geocoder = new google.maps.Geocoder;
      return geocoder.geocode({
        address: _this.address
      }, function(results, status) {
        if (status === 'OK') {
          _this.center = results[0].geometry.location;
          _this.buildStyles();
          return _this.buildMap();
        } else {
          return console.log('couldn\'t convert address with geocoder');
        }
      });
    };

    CoreMap.prototype.buildMap = function() {
      var _this, center, map, mapOptions, marker;
      _this = this;
      mapOptions = {
        zoom: 15,
        center: _this.center,
        disableDefaultUI: true,
        zoomControl: true,
        scrollwheel: false,
        styles: _this.styles
      };
      map = new google.maps.Map(_this.container.el[0], mapOptions);
      center = map.getCenter();
      marker = new google.maps.Marker({
        map: map,
        position: map.getCenter()
      });
      return _this.map_instance = google.maps.event.addDomListener(window, 'resize', theme.utils.debounce(500, function() {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
      }));
    };

    CoreMap.prototype.buildStyles = function() {
      var _this;
      _this = this;
      if (_this.theme === 'grayscale') {
        return _this.styles = [
          {
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#f5f5f5"
              }
            ]
          }, {
            "elementType": "labels.icon",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          }, {
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#616161"
              }
            ]
          }, {
            "elementType": "labels.text.stroke",
            "stylers": [
              {
                "color": "#f5f5f5"
              }
            ]
          }, {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#bdbdbd"
              }
            ]
          }, {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#eeeeee"
              }
            ]
          }, {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          }, {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#e5e5e5"
              }
            ]
          }, {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          }, {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#ffffff"
              }
            ]
          }, {
            "featureType": "road.arterial",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          }, {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#dadada"
              }
            ]
          }, {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#616161"
              }
            ]
          }, {
            "featureType": "road.local",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          }, {
            "featureType": "transit.line",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#e5e5e5"
              }
            ]
          }, {
            "featureType": "transit.station",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#eeeeee"
              }
            ]
          }, {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#c9c9c9"
              }
            ]
          }, {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          }
        ];
      } else if (_this.theme === 'dark') {
        return _this.styles = [
          {
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#212121"
              }
            ]
          }, {
            "elementType": "labels.icon",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          }, {
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          }, {
            "elementType": "labels.text.stroke",
            "stylers": [
              {
                "color": "#212121"
              }
            ]
          }, {
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          }, {
            "featureType": "administrative.country",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          }, {
            "featureType": "administrative.land_parcel",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          }, {
            "featureType": "administrative.locality",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#bdbdbd"
              }
            ]
          }, {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          }, {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#181818"
              }
            ]
          }, {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#616161"
              }
            ]
          }, {
            "featureType": "poi.park",
            "elementType": "labels.text.stroke",
            "stylers": [
              {
                "color": "#1b1b1b"
              }
            ]
          }, {
            "featureType": "road",
            "elementType": "geometry.fill",
            "stylers": [
              {
                "color": "#2c2c2c"
              }
            ]
          }, {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#8a8a8a"
              }
            ]
          }, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#373737"
              }
            ]
          }, {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#3c3c3c"
              }
            ]
          }, {
            "featureType": "road.highway.controlled_access",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#4e4e4e"
              }
            ]
          }, {
            "featureType": "road.local",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#616161"
              }
            ]
          }, {
            "featureType": "transit",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          }, {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#000000"
              }
            ]
          }, {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#3d3d3d"
              }
            ]
          }
        ];
      }
    };

    return CoreMap;

  })();

  theme.classes.CoreMediaQueries = (function() {
    function CoreMediaQueries() {
      this.screenSizeListener = bind(this.screenSizeListener, this);
      this.getScreenSize = bind(this.getScreenSize, this);
      this.medium_screen = 768;
      this.large_screen = 1024;
      this.current_window = null;
      this.getScreenSize();
      this.screenSizeListener();
    }

    CoreMediaQueries.prototype.getScreenSize = function() {
      var _this, previous_window;
      _this = this;
      previous_window = _this.current_window;
      if (window.matchMedia("only screen and (min-width: " + _this.large_screen + "px)").matches) {
        if (_this.current_window !== 'large') {
          _this.current_window = 'large';
        }
      } else if (window.matchMedia("only screen and (min-width: " + _this.medium_screen + "px)").matches) {
        if (_this.current_window !== 'medium') {
          _this.current_window = 'medium';
        }
      } else {
        if (_this.current_window !== 'small') {
          _this.current_window = 'small';
        }
      }
      if (_this.current_window !== previous_window) {
        return window.dispatchEvent(new Event('theme:utils:mqs:updated'));
      }
    };

    CoreMediaQueries.prototype.screenSizeListener = function() {
      var _this;
      _this = this;
      return window.addEventListener('resize', function() {
        return _this.getScreenSize();
      });
    };

    return CoreMediaQueries;

  })();

  theme.classes.CoreModal = (function() {
    function CoreModal(root) {
      var _this;
      this.root = root;
      this.transitionListeners = bind(this.transitionListeners, this);
      _this = this;
      _this.fullscreen = _this.root.data('modal-fullscreen') ? true : false;
      if (_this.root.data('modal-custom-close')) {
        _this.custom_close_button = _this.root.data('modal-custom-close');
      } else {
        _this.custom_close_button = '';
      }
      _this.document_el = el(document);
      _this.force_view = _this.root.data('force-view');
      _this.view = _this.root.data('modal-view');
      _this.viewport = theme.partials.OffCanvas.root;
      _this.main_content_window = theme.partials.OffCanvas.main_content;
      _this.nested_links = _this.root.find(':scope .modal--root .modal--link');
      _this.nested_content = _this.root.find(':scope .modal--root .modal--content');
      _this.links = _this.root.find('.modal--link').not(_this.nested_links);
      _this.content = _this.root.find('.modal--content').not(_this.nested_content);
      _this.window = el('.modal--window');
      _this.window_container = _this.window.find('.modal--container');
      _this.mask = _this.window.find('.modal--mask');
      _this.close_button = _this.window.find('.modal--close');
      _this.next_button = _this.window.find('.modal--next');
      _this.prev_button = _this.window.find('.modal--prev');
      _this.slider = null;
      _this.slides = null;
      _this.openListeners();
      _this.transitionListeners();
      _this.modal_state = 'closed';
      _this.nav_lock = false;
    }

    CoreModal.prototype.openListeners = function() {
      var _this;
      _this = this;
      return _this.links.on('keypress.CoreModal, click.CoreModal, quick-open', function(event) {
        var clicked_item;
        if (event.type === 'keypress' && theme.utils.a11yClick(event) === false) {
          return false;
        }
        clicked_item = el(this);
        _this.links.each(function(link, index) {
          if (el(link).is(clicked_item)) {
            if (event.type === 'quick-open') {
              return _this.open(index, true);
            } else {
              return _this.open(index);
            }
          }
        });
        event.preventDefault();
        return event.stopPropagation();
      });
    };

    CoreModal.prototype.open = function(index, quick_open) {
      var _this, scrolled_position;
      if (quick_open == null) {
        quick_open = false;
      }
      _this = this;
      if (_this.modal_state === 'closed') {
        _this.modal_state = 'opened';
        theme.body.attr('data-modal-open', true);
        theme.window.trigger('theme:modal:opened');
        _this.window.attr('data-modal-fullscreen', _this.fullscreen);
        _this.window.attr('data-modal-custom-close', _this.custom_close_button);
        _this.window.attr('data-modal-view', _this.view);
        _this.viewport.css('overflow', 'hidden');
        _this.closeListeners();
        _this.positionListeners();
        scrolled_position = window.pageYOffset;
        _this.main_content_window.css('position', 'fixed');
        _this.main_content_window.css('top', "-" + scrolled_position + "px");
        _this.moveContentToWindow();
        if (_this.slides.length > 1) {
          _this.next_button.show();
          _this.prev_button.show();
          _this.prevListeners();
          _this.nextListeners();
        }
        _this.window.css('visibility', 'visible');
        _this.window_container.show();
        if (quick_open) {
          _this.slides.eq(index).addClass('active');
          return _this.position();
        } else {
          _this.mask.attr('data-transition', 'forwards');
          return _this.loadModal(_this.slides.eq(index), function() {
            return setTimeout(function() {
              return _this.window_container.find('input[type="text"]').focus();
            }, 0);
          });
        }
      }
    };

    CoreModal.prototype.moveContentToWindow = function() {
      var _this, content;
      _this = this;
      content = _this.root.find('.modal--content').not(_this.nested_content);
      _this.window_container.append(content);
      return _this.slides = _this.window_container.find('.modal--content');
    };

    CoreModal.prototype.extractVideoType = function(src_url) {
      var _this, matches, re;
      _this = this;
      re = /\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=|embed\/)?([a-z0-9_\-]+)/i;
      matches = re.exec(src_url);
      if (matches) {
        return 'youtube';
      }
      re = /^.*(vimeo)\.com\/(?:watch\?v=)?(.*?)(?:\z|$|&)/;
      matches = re.exec(src_url);
      if (matches) {
        return 'vimeo';
      }
      re = /^.*(kickstarter)\.com/g;
      matches = re.exec(src_url);
      if (matches) {
        return 'kickstarter';
      }
      return false;
    };

    CoreModal.prototype.extractVideoId = function(src_url, type) {
      var _this, match, regExp;
      _this = this;
      if (type === 'youtube') {
        regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        match = src_url.match(regExp);
        if (match && match[2].length === 11) {
          return match[2];
        }
      } else if (type === "vimeo") {
        regExp = /^.*(vimeo)\.com\/(?:watch\?v=)?(.*?)(?:\z|$|&)/;
        match = src_url.match(regExp);
        if (match) {
          return match[2];
        }
      } else if (type === "kickstarter") {
        regExp = /(?:kickstarter\.com\/projects\/)(.*)(|\?)/;
        match = src_url.match(regExp);
        if (match) {
          return match[1];
        }
      }
    };

    CoreModal.prototype.createIframe = function(type, id) {
      var _this;
      _this = this;
      if (type === "youtube") {
        return "<iframe src='//www.youtube.com/embed/" + id + "?autoplay=1' frameborder='0' allowfullwidth></iframe>";
      } else if (type === "vimeo") {
        return "<iframe src='//player.vimeo.com/video/" + id + "?title=0&amp;byline=0&amp;portrait=0&amp;color=ffffff&amp;autoplay=1?' frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>";
      } else if (type === "kickstarter") {
        return "<iframe src='//www.kickstarter.com/projects/" + id + "/widget/video.html' frameborder='0' webkitallowfullwidth mozallowfullwidth allowfullwidth></iframe>";
      }
    };

    CoreModal.prototype.loadModal = function(modal, callback) {
      var _this;
      _this = this;
      modal.addClass('active');
      _this.position();
      if (callback) {
        callback();
      }
      return _this.nav_lock = false;
    };

    CoreModal.prototype.position = function() {
      var _this, active_modal, entire_modal_height, modal_height, modal_width;
      _this = this;
      if (_this.window_container != null) {
        active_modal = _this.content.filter('.active');
        _this.window_container.removeAttr('style');
        _this.window.removeClass('fixed');
        modal_height = active_modal.outerHeight();
        modal_width = active_modal.outerWidth();
        entire_modal_height = modal_height + parseInt(_this.window.css('padding-top')) + parseInt(_this.window.css('padding-bottom'));
        if (_this.fullscreen) {
          return;
        }
        if (active_modal.hasClass('type--image')) {
          entire_modal_height = modal_height;
        }
        if (window.innerHeight >= entire_modal_height && _this.force_view !== 'absolute') {
          return _this.window.addClass('fixed');
        } else {
          document.querySelectorAll('html, body').forEach(function(el) {
            return el.scrollTo(0, 0);
          });
          return _this.window.removeClass('fixed');
        }
      }
    };

    CoreModal.prototype.positionListeners = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.CoreModal', function() {
        return _this.position();
      });
    };

    CoreModal.prototype.nextListeners = function() {
      var _this;
      _this = this;
      _this.document_el.on('keydown.CoreModal', function(event) {
        if (event.keyCode === 39) {
          return _this.next();
        }
      });
      return _this.next_button.on('click.CoreModal', function() {
        return _this.next();
      });
    };

    CoreModal.prototype.next = function() {
      var _this, active_slide, index;
      _this = this;
      if (!_this.nav_lock) {
        _this.nav_lock = true;
        index = _this.slides.filter('.active').index();
        _this.slides.removeClass('active');
        if ((index + 1) === _this.slides.length) {
          active_slide = _this.slides.eq(0);
        } else {
          active_slide = _this.slides.eq(index + 1);
        }
        return _this.loadModal(active_slide);
      }
    };

    CoreModal.prototype.prevListeners = function() {
      var _this;
      _this = this;
      _this.document_el.on('keydown.CoreModal', function(event) {
        if (event.keyCode === 37) {
          return _this.prev();
        }
      });
      return _this.prev_button.on('click.CoreModal', function() {
        return _this.prev();
      });
    };

    CoreModal.prototype.prev = function() {
      var _this, active_slide, index;
      _this = this;
      if (!_this.nav_lock) {
        _this.nav_lock = true;
        index = _this.slides.filter('.active').index();
        _this.slides.removeClass('active');
        if (index === 0) {
          active_slide = _this.slides.eq(_this.slides.length - 1);
        } else {
          active_slide = _this.slides.eq(index - 1);
        }
        return _this.loadModal(active_slide);
      }
    };

    CoreModal.prototype.closeListeners = function() {
      var _this;
      _this = this;
      _this.root.on('quick-close', function() {
        return _this.close(true);
      });
      _this.document_el.on('keydown.CoreModal', function(event) {
        if (event.keyCode === 27) {
          return _this.close();
        }
      });
      _this.mask.on('click.CoreModal', function() {
        return _this.close();
      });
      _this.window_container.on('click.CoreModal', function() {
        return _this.close();
      });
      _this.content.on('click.CoreModal', function(event) {
        return event.stopPropagation();
      });
      return _this.close_button.on('click.CoreModal keydown.CoreModal', function() {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        return _this.close();
      });
    };

    CoreModal.prototype.close = function(quick_close) {
      var _this, scrolled_position;
      if (quick_close == null) {
        quick_close = false;
      }
      _this = this;
      scrolled_position = parseInt(_this.main_content_window.css('top')) * -1;
      theme.body.attr('data-modal-open', false);
      theme.window.trigger('theme:modal:closed');
      _this.main_content_window.css('top', '0');
      _this.main_content_window.css('position', 'relative');
      _this.viewport.css('overflow', 'unset');
      window.scrollTo(0, scrolled_position);
      _this.putBackContent();
      _this.next_button.hide();
      _this.prev_button.hide();
      _this.window.css('visibility', 'hidden');
      if (quick_close) {
        _this.mask.hide();
        _this.window_container.empty();
        _this.modal_state = 'closed';
      } else {
        _this.mask.attr('data-transition', 'backwards');
      }
      return _this.removeListeners();
    };

    CoreModal.prototype.putBackContent = function() {
      var _this;
      _this = this;
      return _this.root.append(_this.slides.removeClass('active'));
    };

    CoreModal.prototype.removeListeners = function() {
      var _this;
      _this = this;
      _this.document_el.off('keydown.CoreModal');
      theme.window.off('resize.CoreModal');
      el('body,html').off('DOMMouseScroll.CoreModal mousewheel.CoreModal touchmove.CoreModal');
      _this.next_button.off('click.CoreModal');
      _this.prev_button.off('click.CoreModal');
      _this.close_button.off('click.CoreModal');
      _this.close_button.off('keydown.CoreModal');
      _this.mask.off('click.CoreModal');
      return _this.window_container.off('click.CoreModal');
    };

    CoreModal.prototype.transitionListeners = function() {
      var _this;
      _this = this;
      return _this.mask.on('transition:at_start', function() {
        _this.window_container.empty();
        return _this.modal_state = 'closed';
      });
    };

    return CoreModal;

  })();

  theme.classes.CoreNavigation = (function() {
    function CoreNavigation(root) {
      var _this;
      this.root = root;
      this.activeRefineListeners = bind(this.activeRefineListeners, this);
      this.activePriceListener = bind(this.activePriceListener, this);
      this.activeSortListener = bind(this.activeSortListener, this);
      this.toggleActiveTags = bind(this.toggleActiveTags, this);
      this.renderActiveRefines = bind(this.renderActiveRefines, this);
      this.renderActivePrice = bind(this.renderActivePrice, this);
      this.renderActiveSort = bind(this.renderActiveSort, this);
      this.formatProducts = bind(this.formatProducts, this);
      this.renderGridHtml = bind(this.renderGridHtml, this);
      this.getGridHtml = bind(this.getGridHtml, this);
      this.showLoadingView = bind(this.showLoadingView, this);
      this.getAjaxUrl = bind(this.getAjaxUrl, this);
      this.refineListener = bind(this.refineListener, this);
      this.clearPrices = bind(this.clearPrices, this);
      this.getNewButtonPosition = bind(this.getNewButtonPosition, this);
      this.priceRangeListeners = bind(this.priceRangeListeners, this);
      this.priceRangeResizeListener = bind(this.priceRangeResizeListener, this);
      this.removePriceRangeTransitions = bind(this.removePriceRangeTransitions, this);
      this.restorePriceRangeTransitions = bind(this.restorePriceRangeTransitions, this);
      this.setPriceRangeFill = bind(this.setPriceRangeFill, this);
      this.movePriceRangeButtons = bind(this.movePriceRangeButtons, this);
      this.getPriceRangePositions = bind(this.getPriceRangePositions, this);
      this.getPriceRangeGeometry = bind(this.getPriceRangeGeometry, this);
      this.loadPriceRange = bind(this.loadPriceRange, this);
      this.resetPriceRangeListeners = bind(this.resetPriceRangeListeners, this);
      this.initPriceRangeListener = bind(this.initPriceRangeListener, this);
      this.priceInputListeners = bind(this.priceInputListeners, this);
      this.sortListener = bind(this.sortListener, this);
      this.browseListener = bind(this.browseListener, this);
      this.clearAllListener = bind(this.clearAllListener, this);
      this.menuToggleListeners = bind(this.menuToggleListeners, this);
      this.moveFilterOffCanvas = bind(this.moveFilterOffCanvas, this);
      this.layoutListener = bind(this.layoutListener, this);
      this.setLayout = bind(this.setLayout, this);
      this.initLayout = bind(this.initLayout, this);
      this.sectionListeners = bind(this.sectionListeners, this);
      this.openFilter = bind(this.openFilter, this);
      this.initFilter = bind(this.initFilter, this);
      this.initNavigation = bind(this.initNavigation, this);
      this.initGrid = bind(this.initGrid, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_width = window.innerWidth;
      _this.load();
    }

    CoreNavigation.prototype.load = function() {
      var _this;
      _this = this;
      _this.initGrid();
      _this.initNavigation();
      _this.initFilter();
      _this.openFilter();
      return _this.sectionListeners();
    };

    CoreNavigation.prototype.initGrid = function() {
      var _this;
      _this = this;
      _this.body = document.querySelector('[data-body-root]');
      _this.grid_container = _this.body.querySelector('[data-body-grid]');
      _this.max_columns = _this.body.dataset.maxColumns;
      _this.num_columns = _this.grid_container.dataset.columns;
      _this.pagination = _this.body.querySelector('[data-body-pagination]');
      _this.pagination_link = _this.body.querySelector('[data-body-pagination-link]');
      return _this.spinner = _this.body.querySelector('[data-body-spinner]');
    };

    CoreNavigation.prototype.initNavigation = function() {
      var _this;
      _this = this;
      _this.active_price_tag = _this.root.find('.navigation--active-tag[data-type="price"]');
      _this.active_refine_tag = _this.root.find('.navigation--active-tag[data-type="refine"]');
      _this.active_sort_tag = _this.root.find('.navigation--active-tag[data-type="sort"]');
      _this.active_tags_container = _this.root.find('.navigation--tags-container');
      _this.active_tags_wrapper = _this.root.find('.navigation--active-tags');
      _this.clear_tags_button = _this.root.find('.navigation--active-clear');
      _this.layout_buttons = _this.root.find('.navigation--layout-button');
      _this.refine_button = _this.root.find('.navigation--button[data-toggle-menu="refine-filter"]');
      _this.small_layout_button = _this.layout_buttons.eq(1);
      _this.storage_name = _this.root.attr('data-storage-name');
      _this.url = _this.root.attr('data-url');
      if (_this.layout_buttons.length && _this.max_columns > 2) {
        _this.initLayout();
        _this.setLayout();
        return _this.layoutListener();
      } else {
        return _this.layout_buttons.hide();
      }
    };

    CoreNavigation.prototype.initFilter = function() {
      var _this;
      _this = this;
      _this.filter = _this.root.parent().find('.filter--root');
      if (!_this.filter.length) {
        return;
      }
      _this.moveFilterOffCanvas();
      _this.browse_links = _this.filter.find('[data-type="browse"] .filter--label');
      _this.current_sort_input = _this.filter.find('[data-type="sort"] .filter--input:checked');
      _this.filter_form = _this.filter.el[0].querySelector('.filter--form');
      _this.menu_toggles = _this.filter.find('.filter--toggle');
      _this.refine_links = _this.filter.find('[data-type="refine"] .filter--label');
      _this.price_inputs = _this.filter.find('.filter--price-input');
      _this.reset_button = _this.filter.find('.filter--button[data-type="reset"]');
      _this.sort_links = _this.filter.find('[data-type="sort"] .filter--label');
      _this.swatch_inputs = _this.filter.find('[data-is-swatches="true"] .filter--input');
      if (_this.menu_toggles.length) {
        _this.menuToggleListeners();
        _this.clearAllListener();
      }
      if (_this.browse_links.length) {
        _this.browseListener();
      }
      if (_this.sort_links.length) {
        if (_this.current_sort_input.length) {
          _this.current_sort_link = _this.current_sort_input.siblings('label').el[0];
          _this.current_sort_value = _this.current_sort_input.val();
          _this.current_sort_label = _this.current_sort_input.data('label');
        }
        _this.sortListener();
        _this.renderActiveSort();
        _this.activeSortListener();
      }
      if (_this.refine_links.length) {
        _this.refineListener();
        if (_this.swatch_inputs.length) {
          theme.classes.Radios.setSwatchAppearance(_this.swatch_inputs);
        }
        _this.renderActiveRefines();
      }
      if (_this.price_inputs.length) {
        _this.active_min = _this.active_price_tag.find('[data-min-price]');
        _this.active_max = _this.active_price_tag.find('[data-max-price]');
        _this.button_min_delta = 32;
        _this.price_range_buttons = _this.filter.find('.filter--price-range--button');
        _this.price_range_line = _this.filter.find('.filter--price-range--line');
        _this.price_range_transition = _this.price_range_buttons.css('transition');
        _this.prices = {
          current_min: parseFloat(_this.price_inputs.filter('[data-min-price]').val()),
          pending_min: parseFloat(_this.price_inputs.filter('[data-min-price]').val()),
          current_max: parseFloat(_this.price_inputs.filter('[data-max-price]').val()),
          pending_max: parseFloat(_this.price_inputs.filter('[data-max-price]').val()),
          max: parseFloat(_this.price_inputs.attr('max'))
        };
        _this.priceInputListeners();
        _this.renderActivePrice();
        _this.initPriceRangeListener();
        _this.activePriceListener();
      }
      return _this.toggleActiveTags();
    };

    CoreNavigation.prototype.openFilter = function() {
      var _this, anchor_tag;
      _this = this;
      anchor_tag = window.location.hash.substr(1);
      if (anchor_tag === 'filter--open' && _this.refine_button.length) {
        return setTimeout(function() {
          return _this.refine_button.trigger('click');
        }, 200);
      }
    };

    CoreNavigation.prototype.sectionListeners = function() {
      var _this;
      _this = this;
      return window.addEventListener('shopify:section:load', function() {
        theme.partials.OffCanvas.unload();
        theme.partials.OffCanvas.load();
        _this.initGrid();
        _this.initNavigation();
        _this.initFilter();
        return theme.partials.Search.searchLinks();
      });
    };

    CoreNavigation.prototype.initLayout = function() {
      var _this;
      _this = this;
      _this.layout_buttons.removeAttr('style');
      return _this.small_layout_button.attr('data-column-size', _this.max_columns);
    };

    CoreNavigation.prototype.setLayout = function() {
      var _this, columns;
      _this = this;
      columns = parseInt(localStorage.getItem(theme.local_storage[_this.storage_name]));
      if (!(columns && (columns === 2 || columns === _this.num_columns))) {
        columns = _this.num_columns;
        localStorage.setItem(theme.local_storage[_this.storage_name], columns);
      }
      _this.grid_container.setAttribute('data-columns', columns);
      _this.layout_buttons.attr('data-active', false);
      _this.layout_buttons.filter("[data-column-size='" + columns + "']").attr('data-active', true);
      return theme.window.trigger('theme:navigation:productsUpdated');
    };

    CoreNavigation.prototype.layoutListener = function() {
      var _this;
      _this = this;
      _this.layout_buttons.off('click keydown');
      return _this.layout_buttons.on('click keydown', function(event) {
        var column_size;
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        column_size = parseInt(this.dataset.columnSize);
        localStorage.setItem(theme.local_storage[_this.storage_name], column_size);
        return _this.setLayout();
      });
    };

    CoreNavigation.prototype.moveFilterOffCanvas = function() {
      var _this, off_canvas_filter_container;
      _this = this;
      off_canvas_filter_container = document.querySelector('[data-view="filter"]');
      off_canvas_filter_container.innerHTML = '';
      return off_canvas_filter_container.appendChild(_this.filter.el[0]);
    };

    CoreNavigation.prototype.menuToggleListeners = function() {
      var _this;
      _this = this;
      return _this.menu_toggles.on('click keydown', function(event) {
        var aria_expanded, selected_menu;
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        aria_expanded = this.getAttribute('aria-expanded') !== 'true';
        this.setAttribute('aria-expanded', aria_expanded);
        selected_menu = this.nextElementSibling;
        if (aria_expanded) {
          return setTimeout(function() {
            return selected_menu.setAttribute('data-transition', 'fade-in');
          }, 0);
        } else {
          return selected_menu.setAttribute('data-transition', 'fade-out');
        }
      });
    };

    CoreNavigation.prototype.clearAllListener = function() {
      var _this;
      _this = this;
      return _this.clear_tags_button.add(_this.reset_button).on('click keydown', function(event) {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        if (_this.current_sort_link) {
          _this.current_sort_link.click();
        }
        if (_this.price_inputs.length) {
          _this.clearPrices();
        }
        if (_this.active_refine_tags.length) {
          _this.active_refine_tags.forEach(function(tag) {
            return tag.trigger('click');
          });
        }
        return this.focus();
      });
    };

    CoreNavigation.prototype.browseListener = function() {
      var _this;
      _this = this;
      return _this.browse_links.on('click keydown', function(event) {
        var input, remove_value;
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        input = this.previousElementSibling;
        remove_value = false;
        if (input.checked) {
          remove_value = true;
        }
        return setTimeout(function() {
          var location_pathname;
          if (remove_value) {
            input.checked = false;
            location_pathname = theme.urls.all_products_collection;
          } else {
            location_pathname = input.value;
          }
          location.href = "" + location.origin + location_pathname;
          return setTimeout(function() {
            return theme.partials.OffCanvas.closeRight();
          }, 350);
        }, 0);
      });
    };

    CoreNavigation.prototype.sortListener = function() {
      var _this;
      _this = this;
      return _this.sort_links.on('click keydown', function(event) {
        var input, remove_value, sort_link;
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        sort_link = this;
        input = sort_link.previousElementSibling;
        remove_value = false;
        if (input.checked) {
          remove_value = true;
        }
        return setTimeout(function() {
          if (remove_value) {
            input.checked = false;
            _this.current_sort_link = false;
            _this.current_sort_label = false;
            _this.current_sort_value = false;
          } else {
            input.checked = true;
            _this.current_sort_link = sort_link;
            _this.current_sort_label = input.dataset.label;
            _this.current_sort_value = input.value;
          }
          _this.showLoadingView();
          _this.renderActiveSort();
          return _this.getAjaxUrl();
        }, 0);
      });
    };

    CoreNavigation.prototype.priceInputListeners = function() {
      var _this;
      _this = this;
      _this.price_inputs.on('keydown', function(event) {
        var key;
        key = event.which;
        if ((key < 48 || key > 57) && (key < 37 || key > 40) && key !== 8 && key !== 9 && key !== 13 && key !== 65 && key !== 67 && key !== 86 && key !== 88 && key !== 91 && key !== 188 && key !== 190) {
          return event.preventDefault();
        }
      });
      return _this.price_inputs.on('change', function() {
        var new_current_max, new_current_min, new_value;
        new_value = parseFloat(this.value);
        if (this.dataset.hasOwnProperty('minPrice')) {
          if ((new_value + _this.price_min_delta) > _this.prices.current_max) {
            if (new_value > (_this.prices.max - _this.price_min_delta)) {
              new_current_min = _this.prices.max - _this.price_min_delta;
              _this.prices.current_max = _this.prices.max;
            } else {
              new_current_min = new_value;
              _this.prices.current_max = new_value + _this.price_min_delta;
            }
            this.value = new_current_min;
            _this.prices.current_min = new_current_min;
            _this.price_inputs.filter('[data-max-price]').val(_this.prices.current_max);
          } else {
            _this.prices.current_min = new_value;
          }
        } else if (this.dataset.hasOwnProperty('maxPrice')) {
          if (new_value > _this.prices.max) {
            this.value = _this.prices.max;
            _this.prices.current_max = _this.prices.max;
          } else if ((_this.prices.current_min + _this.price_min_delta) > new_value) {
            if (0 > (new_value - _this.price_min_delta)) {
              new_current_max = _this.price_min_delta;
              _this.prices.current_min = 0;
            } else {
              new_current_max = new_value;
              _this.prices.current_min = new_value - _this.price_min_delta;
            }
            this.value = new_current_max;
            _this.prices.current_max = new_current_max;
            _this.price_inputs.filter('[data-min-price]').val(_this.prices.current_min);
          } else {
            _this.prices.current_max = new_value;
          }
        }
        _this.getPriceRangePositions();
        _this.movePriceRangeButtons();
        _this.setPriceRangeFill();
        _this.renderActivePrice();
        _this.showLoadingView();
        return _this.getAjaxUrl();
      });
    };

    CoreNavigation.prototype.initPriceRangeListener = function() {
      var _this;
      _this = this;
      return theme.window.on('theme:offCanvas:rightOpened', function() {
        _this.resetPriceRangeListeners();
        return _this.loadPriceRange();
      });
    };

    CoreNavigation.prototype.resetPriceRangeListeners = function() {
      var _this;
      _this = this;
      _this.price_range_buttons.off('mousedown.priceRange touchstart.priceRange');
      theme.window.off('theme:offCanvas:rightOpened');
      theme.window.off('resize.priceRange');
      theme.window.off('mousemove.priceRange touchmove.priceRange');
      return theme.window.off('mouseup.priceRange touchend.priceRange');
    };

    CoreNavigation.prototype.loadPriceRange = function() {
      var _this;
      _this = this;
      _this.getPriceRangeGeometry();
      _this.priceRangeResizeListener();
      return _this.priceRangeListeners();
    };

    CoreNavigation.prototype.getPriceRangeGeometry = function() {
      var _this;
      _this = this;
      _this.restorePriceRangeTransitions();
      _this.price_range_width = _this.price_range_line.width();
      if (!_this.price_range_width) {
        return;
      }
      _this.pixels_per_price = _this.price_range_width / _this.prices.max;
      _this.price_min_delta = Math.round(_this.button_min_delta * (1 / _this.pixels_per_price));
      _this.getPriceRangePositions();
      _this.movePriceRangeButtons();
      _this.setPriceRangeFill();
      return _this.removePriceRangeTransitions();
    };

    CoreNavigation.prototype.getPriceRangePositions = function() {
      var _this;
      _this = this;
      return _this.price_positions = {
        min: _this.prices.current_min * _this.pixels_per_price,
        max: _this.prices.current_max * _this.pixels_per_price
      };
    };

    CoreNavigation.prototype.movePriceRangeButtons = function() {
      var _this;
      _this = this;
      return _this.price_range_buttons.each(function(button) {
        if (button.dataset.hasOwnProperty('maxPrice')) {
          return button.style.transform = "translateX(-" + (_this.price_range_width - _this.price_positions.max) + "px)";
        } else {
          return button.style.transform = "translateX(" + _this.price_positions.min + "px)";
        }
      });
    };

    CoreNavigation.prototype.setPriceRangeFill = function() {
      var _this, price_range_fill, right_offset;
      _this = this;
      price_range_fill = _this.price_range_line.children();
      right_offset = _this.price_range_width - _this.price_positions.max;
      price_range_fill.css('margin', "0 " + right_offset + "px 0 " + _this.price_positions.min + "px");
      return price_range_fill.css('width', "calc(100% - " + (right_offset + _this.price_positions.min) + "px)");
    };

    CoreNavigation.prototype.restorePriceRangeTransitions = function() {
      var _this, transition_els;
      _this = this;
      transition_els = _this.price_range_line.add(_this.price_range_buttons);
      return transition_els.css('transition', _this.price_range_transition);
    };

    CoreNavigation.prototype.removePriceRangeTransitions = function() {
      var _this, transition_els;
      _this = this;
      transition_els = _this.price_range_line.add(_this.price_range_buttons);
      if (_this.prices.current_min === 0 && _this.prices.current_max === _this.prices.max) {
        return transition_els.css('transition', 'unset');
      } else {
        return transition_els.on('transitionend', function() {
          transition_els.css('transition', 'unset');
          return transition_els.off('transitionend');
        });
      }
    };

    CoreNavigation.prototype.priceRangeResizeListener = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.priceRange', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.current_width = window.innerWidth;
          _this.initPriceRangeListener();
          return _this.getPriceRangeGeometry();
        }
      }));
    };

    CoreNavigation.prototype.priceRangeListeners = function() {
      var _this;
      _this = this;
      _this.price_range_buttons.on('mousedown.priceRange touchstart.priceRange', function(event) {
        _this.active_range_button = this;
        theme.utils.disable_swipe_listener = true;
        if (event.type === 'touchstart') {
          return _this.drag_start = event.targetTouches[0].pageX;
        } else {
          return _this.drag_start = event.pageX;
        }
      });
      theme.window.on('mousemove.priceRange touchmove.priceRange', function(event) {
        if (!_this.drag_start) {
          return;
        }
        if (_this.animation_request) {
          cancelAnimationFrame(_this.animation_request);
        }
        return _this.animation_request = requestAnimationFrame(function() {
          return _this.getNewButtonPosition(event);
        });
      });
      return theme.window.on('mouseup.priceRange touchend.priceRange', function(event) {
        if (!_this.drag_start) {
          return;
        }
        _this.price_inputs.trigger('change');
        _this.drag_start = false;
        theme.utils.disable_swipe_listener = false;
        if (_this.active_range_button.dataset.hasOwnProperty('maxPrice')) {
          return _this.prices.current_max = parseFloat(_this.prices.pending_max);
        } else {
          return _this.prices.current_min = parseFloat(_this.prices.pending_min);
        }
      });
    };

    CoreNavigation.prototype.getNewButtonPosition = function(event) {
      var _this, offset, pending_pos;
      _this = this;
      if (event.type === 'touchmove') {
        offset = event.targetTouches[0].pageX - _this.drag_start;
      } else {
        offset = event.pageX - _this.drag_start;
      }
      if (_this.active_range_button.dataset.hasOwnProperty('maxPrice')) {
        pending_pos = (_this.prices.current_max * _this.pixels_per_price) + offset;
        if (pending_pos > _this.price_range_width) {
          pending_pos = _this.price_range_width;
        } else if (_this.price_positions.min > pending_pos - _this.button_min_delta) {
          pending_pos = _this.price_positions.min + _this.button_min_delta;
        }
        _this.price_positions.max = pending_pos;
        _this.prices.pending_max = Math.round(pending_pos * (1 / _this.pixels_per_price));
        _this.price_inputs.filter('[data-max-price]').val(_this.prices.pending_max);
      } else {
        pending_pos = (_this.prices.current_min * _this.pixels_per_price) + offset;
        if (pending_pos < 0) {
          pending_pos = 0;
        } else if (pending_pos > _this.price_positions.max - _this.button_min_delta) {
          pending_pos = _this.price_positions.max - _this.button_min_delta;
        }
        _this.price_positions.min = pending_pos;
        _this.prices.pending_min = Math.round(pending_pos * (1 / _this.pixels_per_price));
        _this.price_inputs.filter('[data-min-price]').val(_this.prices.pending_min);
      }
      _this.movePriceRangeButtons();
      return _this.setPriceRangeFill();
    };

    CoreNavigation.prototype.clearPrices = function() {
      var _this, update_prices;
      _this = this;
      update_prices = false;
      _this.price_inputs.each(function(input) {
        var current_value;
        current_value = parseFloat(input.value);
        if (input.dataset.hasOwnProperty('minPrice') && current_value !== 0) {
          input.value = 0;
          return update_prices = true;
        } else if (input.dataset.hasOwnProperty('maxPrice') && current_value !== _this.prices.max) {
          input.value = _this.prices.max;
          return update_prices = true;
        }
      });
      if (update_prices) {
        return _this.price_inputs.trigger('change');
      }
    };

    CoreNavigation.prototype.refineListener = function() {
      var _this;
      _this = this;
      return _this.refine_links.on('click keydown', function(event) {
        var input;
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        if (event.key === 'Enter') {
          input = this.previousElementSibling;
          input.checked = !input.checked;
        }
        return setTimeout(function() {
          _this.active_tags_wrapper.find('.navigation--active-tag[data-type="refine"]').remove();
          _this.showLoadingView();
          _this.renderActiveRefines();
          return _this.getAjaxUrl();
        }, 0);
      });
    };

    CoreNavigation.prototype.getAjaxUrl = function() {
      var _this, form_data, search_params;
      _this = this;
      form_data = new FormData(_this.filter_form);
      search_params = new URLSearchParams(form_data);
      _this.ajax_url = "" + _this.url + (search_params.toString());
      history.replaceState({}, '', _this.ajax_url);
      _this.getGridHtml();
      return _this.toggleActiveTags();
    };

    CoreNavigation.prototype.showLoadingView = function() {
      var _this;
      _this = this;
      _this.grid_container.innerHTML = '';
      _this.grid_container.style.display = 'none';
      _this.pagination.style.display = 'none';
      return _this.spinner.style.display = 'flex';
    };

    CoreNavigation.prototype.getGridHtml = function() {
      var _this;
      _this = this;
      if (_this.request) {
        _this.request.abort();
      }
      _this.request = new XMLHttpRequest();
      _this.request.onload = function() {
        var body_html;
        if (_this.request.status >= 200 && _this.request.status < 300) {
          body_html = theme.utils.parseHtml(_this.request.response, '[data-body-root]');
          _this.renderGridHtml(body_html);
          _this.spinner.style.display = 'none';
          _this.grid_container.removeAttribute('style');
          theme.classes.Product.clearQuickAddForms('filter');
          if (body_html.find('.product--root').length > 0) {
            return _this.formatProducts();
          }
        }
      };
      _this.request.onerror = function() {
        return console.log(_this.request.statusText + ": filter request failed!");
      };
      _this.request.open("GET", _this.ajax_url);
      return _this.request.send();
    };

    CoreNavigation.prototype.renderGridHtml = function(body_html) {
      var _this, grid_html, pagination_root;
      _this = this;
      grid_html = body_html.find('[data-body-grid]').html();
      _this.grid_container.innerHTML = grid_html;
      pagination_root = body_html.find('[data-body-pagination]');
      if (pagination_root.html()) {
        _this.pagination.innerHTML = pagination_root.html();
        _this.pagination.removeAttribute('style');
        if (_this.pagination_link) {
          return _this.pagination_link.style.display = 'block';
        }
      } else if (_this.pagination_link) {
        return _this.pagination_link.style.display = 'none';
      }
    };

    CoreNavigation.prototype.formatProducts = function() {
      var _this;
      _this = this;
      theme.window.trigger('theme:navigation:productsUpdated');
      theme.utils.loadJsClasses(el(_this.grid_container));
      if (theme.settings.quick_add) {
        theme.partials.OffCanvas.unload();
        return theme.partials.OffCanvas.load();
      }
    };

    CoreNavigation.prototype.renderActiveSort = function() {
      var _this;
      _this = this;
      if (_this.current_sort_value) {
        _this.render_active_sort = true;
        _this.active_sort_tag.find('span').text(_this.current_sort_label);
        _this.active_sort_tag.attr('data-value', _this.current_sort_value);
        return _this.active_sort_tag.removeAttr('style');
      } else {
        _this.render_active_sort = false;
        return _this.active_sort_tag.hide();
      }
    };

    CoreNavigation.prototype.renderActivePrice = function() {
      var _this;
      _this = this;
      if (_this.prices.current_min === 0 && _this.prices.current_max === _this.prices.max) {
        _this.active_price_tag.hide();
        return _this.render_active_price = false;
      } else {
        _this.render_active_price = true;
        _this.active_min.text("" + _this.prices.current_min);
        _this.active_max.text("" + _this.prices.current_max);
        return _this.active_price_tag.removeAttr('style');
      }
    };

    CoreNavigation.prototype.renderActiveRefines = function() {
      var _this, active_refine, active_refine_el, active_swatch, index, j, ref;
      _this = this;
      _this.active_refine_tags = [];
      _this.render_active_refine = false;
      active_refine = {
        values: [],
        names: [],
        labels: [],
        swatches: []
      };
      _this.filter.find('[data-type="refine"] input:checked').each(function(input) {
        var label;
        active_refine.values.push(input.value);
        active_refine.names.push(input.name);
        active_refine.labels.push(input.getAttribute('data-label'));
        label = input.nextElementSibling;
        if (label.dataset.item === 'swatch') {
          return active_refine.swatches.push(label.getAttribute('style'));
        } else {
          return active_refine.swatches.push(false);
        }
      });
      if (active_refine.values.length > 0) {
        for (index = j = 0, ref = active_refine.values.length - 1; 0 <= ref ? j <= ref : j >= ref; index = 0 <= ref ? ++j : --j) {
          active_refine_el = _this.active_refine_tag.clone().removeAttr('style');
          active_refine_el.attr('data-value', active_refine.values[index]);
          active_refine_el.attr('data-name', active_refine.names[index]);
          active_refine_el.find('span').text(active_refine.labels[index]);
          active_swatch = active_refine_el.find('[data-item="swatch"]');
          if (active_refine.swatches[index] && active_swatch.length) {
            active_swatch.attr('style', active_refine.swatches[index]);
          } else if (active_swatch.length) {
            active_swatch.remove();
          }
          _this.active_tags_wrapper.prepend(active_refine_el);
          _this.active_refine_tags.push(active_refine_el);
        }
        _this.render_active_refine = true;
        return _this.activeRefineListeners();
      }
    };

    CoreNavigation.prototype.toggleActiveTags = function() {
      var _this, render_tags;
      _this = this;
      render_tags = _this.render_active_refine || _this.render_active_sort || _this.render_active_price;
      if (render_tags) {
        return _this.active_tags_container.show();
      } else {
        return _this.active_tags_container.hide();
      }
    };

    CoreNavigation.prototype.activeSortListener = function() {
      var _this;
      _this = this;
      return _this.active_sort_tag.on('click keydown', function(event) {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        return _this.current_sort_link.click();
      });
    };

    CoreNavigation.prototype.activePriceListener = function() {
      var _this;
      _this = this;
      return _this.active_price_tag.on('click keydown', function(event) {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        return _this.clearPrices();
      });
    };

    CoreNavigation.prototype.activeRefineListeners = function() {
      var _this;
      _this = this;
      return _this.active_refine_tags.forEach(function(active_refine_tag) {
        return active_refine_tag.on('click keydown', function(event) {
          var input, j, len, ref, tag_link;
          if (event.type === 'keydown' && event.key !== 'Enter') {
            return;
          }
          ref = _this.refine_links.el;
          for (j = 0, len = ref.length; j < len; j++) {
            tag_link = ref[j];
            input = tag_link.previousElementSibling;
            if (input.value === this.dataset.value && input.name === this.dataset.name) {
              tag_link.click();
              input.checked = false;
              return;
            }
          }
        });
      });
    };

    CoreNavigation.toggleFilterMenu = function(toggle_name) {
      var _this;
      _this = CoreNavigation;
      return document.querySelectorAll('.filter--toggle').forEach(function(toggle) {
        var menu_name;
        toggle.setAttribute('aria-expanded', false);
        menu_name = toggle.getAttribute('aria-controls');
        if (menu_name.includes(toggle_name)) {
          return toggle.click();
        }
      });
    };

    return CoreNavigation;

  })();

  theme.classes.CoreOffCanvas = (function() {
    function CoreOffCanvas(root) {
      var _this;
      this.root = root;
      this.transitionListeners = bind(this.transitionListeners, this);
      this.touchListener = bind(this.touchListener, this);
      this.closeComplete = bind(this.closeComplete, this);
      this.closeRight = bind(this.closeRight, this);
      this.closeLeft = bind(this.closeLeft, this);
      this.openComplete = bind(this.openComplete, this);
      this.openRight = bind(this.openRight, this);
      this.openLeft = bind(this.openLeft, this);
      this.toggle = bind(this.toggle, this);
      this.closeWithEscKey = bind(this.closeWithEscKey, this);
      this.closeWhenFocusOut = bind(this.closeWhenFocusOut, this);
      this.toggleListeners = bind(this.toggleListeners, this);
      this.viewPortHeightListener = bind(this.viewPortHeightListener, this);
      this.setViewPortHeight = bind(this.setViewPortHeight, this);
      this.setState = bind(this.setState, this);
      this.unload = bind(this.unload, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.left_sidebar = _this.root.find('.off-canvas--left-sidebar');
      _this.right_sidebar = _this.root.find('.off-canvas--right-sidebar');
      _this.focus_triggers = _this.root.find('.off-canvas--focus-trigger');
      _this.main_content = _this.root.find('.off-canvas--main-content');
      _this.overlay = _this.root.find('.off-canvas--overlay');
      _this.state = 'closed';
      _this.load();
    }

    CoreOffCanvas.prototype.load = function() {
      var _this;
      _this = this;
      _this.close = el('[data-off-canvas--close]');
      _this.triggers = el('[data-off-canvas--open]');
      _this.setViewPortHeight();
      _this.viewPortHeightListener();
      _this.toggleListeners();
      _this.touchListener();
      _this.closeWhenFocusOut();
      _this.closeWithEscKey();
      return _this.transitionListeners();
    };

    CoreOffCanvas.prototype.unload = function() {
      var _this;
      _this = this;
      _this.triggers.off('click keydown');
      return _this.overlay.add(_this.close).off('click');
    };

    CoreOffCanvas.prototype.setState = function(state) {
      var _this;
      _this = this;
      _this.state = state;
      _this.root.attr('data-off-canvas--state', state);
      if (_this.state === 'left--opening') {
        _this.left_sidebar.attr('data-transition', 'forwards');
        _this.overlay.attr('data-transition', 'forwards');
      }
      if (_this.state === 'left--closing') {
        _this.left_sidebar.attr('data-transition', 'backwards');
        _this.overlay.attr('data-transition', 'backwards');
      }
      if (_this.state === 'right--opening') {
        _this.right_sidebar.attr('data-transition', 'forwards');
        _this.overlay.attr('data-transition', 'forwards');
      }
      if (_this.state === 'right--closing') {
        _this.right_sidebar.attr('data-transition', 'backwards');
        return _this.overlay.attr('data-transition', 'backwards');
      }
    };

    CoreOffCanvas.prototype.setViewPortHeight = function() {
      var _this;
      _this = this;
      return _this.root.css('min-height', window.innerHeight + "px");
    };

    CoreOffCanvas.prototype.viewPortHeightListener = function() {
      var _this;
      _this = this;
      return window.addEventListener('resize', function() {
        return _this.setViewPortHeight();
      });
    };

    CoreOffCanvas.prototype.toggleListeners = function() {
      var _this;
      _this = this;
      _this.triggers.on('click keydown', function(event) {
        var drawer;
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        drawer = this.dataset['offCanvas-Open'];
        _this.last_trigger = this;
        if (drawer === 'left-sidebar') {
          _this.toggle('left-sidebar');
        } else if (drawer === 'right-sidebar') {
          _this.right_sidebar_view = this.dataset['offCanvas-View'];
          _this.right_sidebar.attr('data-active', _this.right_sidebar_view);
          if (_this.right_sidebar_view === 'product-form') {
            theme.classes.Product.initQuickAddForm(this);
          } else if (_this.right_sidebar_view === 'filter') {
            theme.classes.Navigation.toggleFilterMenu(this.dataset.toggleMenu);
          } else if (_this.right_sidebar_view === 'cart' && this.dataset.productId) {
            event.preventDefault();
            event.stopPropagation();
            theme.classes.Product.quickAddToCart(this);
            return false;
          }
          _this.toggle('right-sidebar');
        }
        event.preventDefault();
        return event.stopPropagation();
      });
      return _this.overlay.add(_this.close).on('click keydown', function() {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        if (_this.state === 'left--opened') {
          return _this.toggle('left-sidebar');
        } else if (_this.state === 'right--opened') {
          return _this.toggle('right-sidebar');
        }
      });
    };

    CoreOffCanvas.prototype.closeWhenFocusOut = function() {
      var _this;
      _this = this;
      return _this.focus_triggers.on('focus', function() {
        if (_this.state === 'left--opened') {
          return _this.closeLeft();
        } else if (_this.state === 'right--opened') {
          return _this.closeRight();
        }
      });
    };

    CoreOffCanvas.prototype.closeWithEscKey = function() {
      var _this;
      _this = this;
      return window.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') {
          return;
        }
        if (_this.state === 'left--opened') {
          return _this.closeLeft();
        } else if (_this.state === 'right--opened') {
          return _this.closeRight();
        }
      });
    };

    CoreOffCanvas.prototype.toggle = function(element) {
      var _this;
      _this = this;
      if (element === 'left-sidebar' && _this.state === 'closed') {
        return _this.openLeft();
      } else if (element === 'left-sidebar' && _this.state === 'left--opened') {
        return _this.closeLeft();
      } else if (element === 'right-sidebar' && _this.state === 'closed') {
        return _this.openRight();
      } else if (element === 'right-sidebar' && _this.state === 'right--opened') {
        return _this.closeRight();
      }
    };

    CoreOffCanvas.prototype.openLeft = function() {
      var _this;
      _this = this;
      _this.root.css('overflow', 'hidden');
      _this.left_sidebar.css('display', 'block');
      _this.window_offset = window.pageYOffset;
      _this.main_content.css('top', "-" + _this.window_offset + "px");
      _this.main_content.css('position', 'fixed');
      _this.setState('left--opening');
      return window.scrollTo(0, 0);
    };

    CoreOffCanvas.prototype.openRight = function() {
      var _this;
      _this = this;
      _this.root.css('overflow', 'hidden');
      _this.right_sidebar.css('display', 'block');
      _this.window_offset = window.pageYOffset;
      _this.main_content.css('top', "-" + _this.window_offset + "px");
      _this.main_content.css('position', 'fixed');
      _this.setState('right--opening');
      return window.scrollTo(0, 0);
    };

    CoreOffCanvas.prototype.openComplete = function(element) {
      var _this, current_view, focusable_elements, open_event;
      _this = this;
      if (element === 'right-sidebar') {
        current_view = _this.right_sidebar.find("[data-view='" + _this.right_sidebar_view + "']");
        open_event = new Event('theme:offCanvas:rightOpened');
      } else if (element = 'left-sidebar') {
        current_view = _this.left_sidebar.find("[data-view='menu']");
        open_event = new Event('theme:offCanvas:leftOpened');
      }
      window.dispatchEvent(open_event);
      focusable_elements = theme.utils.getFocusableEl(current_view);
      if (focusable_elements) {
        return focusable_elements.focus(0);
      }
    };

    CoreOffCanvas.prototype.closeLeft = function() {
      var _this;
      _this = this;
      _this.setState('left--closing');
      return _this.last_trigger.focus();
    };

    CoreOffCanvas.prototype.closeRight = function() {
      var _this;
      _this = this;
      _this.setState('right--closing');
      return _this.last_trigger.focus();
    };

    CoreOffCanvas.prototype.closeComplete = function() {
      var _this;
      _this = this;
      _this.root.css('overflow', 'unset');
      _this.left_sidebar.css('display', 'none');
      _this.right_sidebar.css('display', 'none');
      _this.main_content.css('position', 'relative');
      _this.main_content.css('top', 'initial');
      return window.scrollTo(0, _this.window_offset);
    };

    CoreOffCanvas.prototype.touchListener = function() {
      var _this;
      _this = this;
      if (!theme.utils.isTouchDevice()) {
        return;
      }
      document.addEventListener('theme:swipe:left', function() {
        if (_this.state === 'left--opened') {
          return _this.closeLeft();
        }
      });
      return document.addEventListener('theme:swipe:right', function() {
        if (_this.state === 'right--opened') {
          return _this.closeRight();
        }
      });
    };

    CoreOffCanvas.prototype.transitionListeners = function() {
      var _this;
      _this = this;
      _this.overlay.on('transition:at_start', function() {
        _this.setState('closed');
        return _this.closeComplete();
      });
      return _this.overlay.on('transition:at_end', function() {
        if (_this.state === 'left--opening') {
          _this.setState('left--opened');
          _this.openComplete('left-sidebar');
        }
        if (_this.state === 'right--opening') {
          _this.setState('right--opened');
          return _this.openComplete('right-sidebar');
        }
      });
    };

    return CoreOffCanvas;

  })();

  theme.classes.CoreProductModel = (function() {
    function CoreProductModel(root) {
      var _this;
      this.root = root;
      this.loadModel = bind(this.loadModel, this);
      this.loadAssets = bind(this.loadAssets, this);
      this.eventListeners = bind(this.eventListeners, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.all_models = el('.product-model--root');
      _this.view = _this.root.data('view');
      _this.key = _this.root.closest('[data-id]').data('id');
      _this.cdn = 'https://cdn.shopify.com/shopifycloud/model-viewer-ui/assets/v1.0/model-viewer-ui';
      _this.xr_cdn = 'https://cdn.shopify.com/shopifycloud/shopify-xr-js/assets/v1.0/shopify-xr.en.js';
      _this.load();
    }

    CoreProductModel.prototype.load = function() {
      var _this;
      _this = this;
      _this.eventListeners();
      if (theme.libraries.model) {
        return;
      }
      return _this.loadAssets();
    };

    CoreProductModel.prototype.eventListeners = function() {
      var _this;
      _this = this;
      _this.root.on('model-ready', function() {
        return _this.loadModel();
      });
      _this.root.on('theme:section:load', function() {
        return _this.loadModel();
      });
      _this.root.on('pause-media', function() {
        if (_this.model) {
          return _this.model.pause();
        }
      });
      _this.root.on('play-media', function() {
        if (_this.model) {
          return _this.model.play();
        }
      });
      return theme.window.on('resize.ProductModel', theme.utils.debounce(250, function() {
        _this.all_models.trigger('pause-media');
        return _this.all_models.trigger('model-ready');
      }));
    };

    CoreProductModel.prototype.loadAssets = function() {
      var _this;
      _this = this;
      theme.utils.insertStylesheet(_this.cdn + ".css");
      libraryLoader('xr', _this.xr_cdn);
      return libraryLoader('model', _this.cdn + ".en.js", function() {
        return _this.all_models.trigger('model-ready');
      });
    };

    CoreProductModel.prototype.loadModel = function() {
      var _this;
      _this = this;
      if (_this.model) {
        return;
      }
      if (theme.utils.mqs.current_window === 'small' && _this.view === 'desktop') {
        return;
      } else if (theme.utils.mqs.current_window !== 'small' && _this.view === 'mobile') {
        return;
      }
      if (typeof Shopify.ModelViewerUI !== 'undefined') {
        _this.model = new Shopify.ModelViewerUI(_this.root.find('model-viewer').el[0]);
        return theme.window.trigger('theme:product:mediaLoaded');
      }
    };

    return CoreProductModel;

  })();

  theme.classes.CoreProductRecommendations = (function() {
    function CoreProductRecommendations(root) {
      var _this, max_products, product_id;
      this.root = root;
      this.resizeListeners = bind(this.resizeListeners, this);
      this.loadHoverImages = bind(this.loadHoverImages, this);
      this.initProductItems = bind(this.initProductItems, this);
      this.matchImageHeights = bind(this.matchImageHeights, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_width = window.innerWidth;
      _this.item_container = _this.root.find('.product-recommendations--body');
      product_id = _this.root.attr('data-product-id');
      max_products = _this.root.attr('data-max-products');
      _this.request_url = theme.urls.product_recommendations + "?section_id=product-recommendations&limit=" + max_products + "&product_id=" + product_id;
      _this.load();
    }

    CoreProductRecommendations.prototype.load = function() {
      var _this, request;
      _this = this;
      request = new XMLHttpRequest();
      request.onload = function() {
        var body_el, number_of_products;
        if (request.status >= 200 && request.status < 300) {
          body_el = theme.utils.parseHtml(request.response, '.product-recommendations--body');
          _this.item_container.html(body_el.html());
          number_of_products = _this.item_container.find('.product--root').length;
          if (!number_of_products) {
            return;
          }
          _this.root.show();
          _this.matchImageHeights();
          _this.initProductItems();
          _this.loadHoverImages();
          return _this.resizeListeners();
        }
      };
      request.onerror = function() {
        return console.log(request.statusText + ": recommendation HTML request failed!");
      };
      request.open("GET", _this.request_url);
      return request.send();
    };

    CoreProductRecommendations.prototype.matchImageHeights = function() {
      var _this, items;
      _this = this;
      items = _this.root.find('.product--root');
      return theme.utils.matchImageHeights(_this.item_container, items, '.product--image-wrapper');
    };

    CoreProductRecommendations.prototype.initProductItems = function() {
      var _this;
      _this = this;
      if (theme.settings.quick_add) {
        theme.partials.OffCanvas.unload();
        theme.partials.OffCanvas.load();
      }
      return theme.utils.loadJsClasses(_this.root);
    };

    CoreProductRecommendations.prototype.loadHoverImages = function() {
      var _this;
      _this = this;
      return _this.root.find('.product--hover-image').each(function(hover_image) {
        return theme.utils.imagesLoaded(hover_image, function() {
          var product;
          product = hover_image.closest('[data-hover-image="true"]');
          return product.setAttribute('data-hover-image', 'loaded');
        });
      });
    };

    CoreProductRecommendations.prototype.resizeListeners = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.ProductRecommendations', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.matchImageHeights();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    return CoreProductRecommendations;

  })();

  theme.classes.CoreProductVideo = (function() {
    function CoreProductVideo(root) {
      var _this;
      this.root = root;
      this.skipVideo = bind(this.skipVideo, this);
      this.loadYoutubeVideo = bind(this.loadYoutubeVideo, this);
      this.loadPlyrVideo = bind(this.loadPlyrVideo, this);
      this.loadYoutubeAsset = bind(this.loadYoutubeAsset, this);
      this.loadPlyrAssets = bind(this.loadPlyrAssets, this);
      this.resizeListener = bind(this.resizeListener, this);
      this.youtubeListeners = bind(this.youtubeListeners, this);
      this.plyrListeners = bind(this.plyrListeners, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.all_videos = el('.product-video--root');
      _this.view = _this.root.data('view');
      _this.type = _this.root.data('type');
      _this.loop_enabled = _this.root.data('loop-enabled');
      _this.load();
    }

    CoreProductVideo.prototype.load = function() {
      var _this;
      _this = this;
      _this.resizeListener();
      if (_this.type === 'youtube') {
        _this.id = _this.root.find('.product-video').attr('id');
        _this.video_id = _this.root.data('video-id');
        _this.youtubeListeners();
        return _this.loadYoutubeAsset();
      } else {
        _this.plyr_cdn = 'https://cdn.shopify.com/shopifycloud/plyr/v2.0/shopify-plyr';
        _this.plyrListeners();
        return _this.loadPlyrAssets();
      }
    };

    CoreProductVideo.prototype.plyrListeners = function() {
      var _this;
      _this = this;
      _this.root.on('plyr-video-ready', function() {
        return _this.loadPlyrVideo();
      });
      _this.root.on('theme:section:load', function() {
        return _this.loadPlyrVideo();
      });
      _this.root.on('pause-media', function() {
        if (_this.video) {
          return _this.video.pause();
        }
      });
      return _this.root.on('play-media', function() {
        if (_this.video) {
          return _this.video.play();
        }
      });
    };

    CoreProductVideo.prototype.youtubeListeners = function() {
      var _this;
      _this = this;
      window.addEventListener('theme:utils:youtubeAPIReady', function() {
        return _this.loadYoutubeVideo();
      });
      return _this.root.on('theme:section:load', function() {
        return _this.loadYoutubeVideo();
      });
    };

    CoreProductVideo.prototype.resizeListener = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.ProductVideo', theme.utils.debounce(250, function() {
        _this.all_videos.trigger('pause-media');
        _this.all_videos.trigger('plyr-video-ready');
        return _this.all_videos.trigger('theme:utils:youtubeAPIReady');
      }));
    };

    CoreProductVideo.prototype.loadPlyrAssets = function() {
      var _this;
      _this = this;
      if (theme.libraries.plyr) {
        return;
      }
      theme.utils.insertStylesheet(_this.plyr_cdn + ".css");
      return libraryLoader('plyr', _this.plyr_cdn + ".en.js", function() {
        return _this.all_videos.trigger('plyr-video-ready');
      });
    };

    CoreProductVideo.prototype.loadYoutubeAsset = function() {
      var _this;
      _this = this;
      if (theme.libraries.youtube) {
        return;
      }
      return libraryLoader('youtube', 'https://www.youtube.com/iframe_api');
    };

    CoreProductVideo.prototype.loadPlyrVideo = function() {
      var _this;
      _this = this;
      if (_this.video) {
        return;
      }
      if (_this.skipVideo()) {
        return;
      }
      if (typeof Shopify.Video !== 'undefined') {
        _this.video = new Shopify.Video(_this.root.find('video').el[0], {
          iconUrl: _this.plyr_cdn + ".svg",
          loop: {
            active: _this.loop_enabled
          }
        });
        return theme.window.trigger('theme:product:mediaLoaded');
      }
    };

    CoreProductVideo.prototype.loadYoutubeVideo = function() {
      var _this;
      _this = this;
      if (_this.video) {
        return;
      }
      if (_this.skipVideo()) {
        return;
      }
      if (typeof YT !== 'undefined') {
        _this.video = new YT.Player(_this.id, {
          videoId: _this.video_id,
          events: {
            onReady: function(event) {
              _this.root.on('pause-media', function() {
                return event.target.pauseVideo();
              });
              return _this.root.on('play-media', function() {
                return event.target.playVideo();
              });
            },
            onStateChange: function(event) {
              if (event.data === 0 && _this.loop_enabled) {
                event.target.seekTo(0);
              }
              if (event.data === 1) {
                return el('.product-media--featured [data-js-class]').not(_this.root).trigger('pause-media');
              }
            }
          }
        });
        return theme.window.trigger('theme:product:mediaLoaded');
      }
    };

    CoreProductVideo.prototype.skipVideo = function() {
      var _this;
      _this = this;
      if (theme.utils.mqs.current_window === 'small' && _this.view === 'desktop') {
        return true;
      } else if (theme.utils.mqs.current_window !== 'small' && _this.view === 'mobile') {
        return true;
      } else {
        return false;
      }
    };

    return CoreProductVideo;

  })();

  theme.classes.CoreProduct = (function() {
    function CoreProduct(root) {
      var _this;
      this.root = root;
      this.updateRecentList = bind(this.updateRecentList, this);
      this.thumbNavigation = bind(this.thumbNavigation, this);
      this.initZoomListener = bind(this.initZoomListener, this);
      this.getActiveImageId = bind(this.getActiveImageId, this);
      this.imageZoom = bind(this.imageZoom, this);
      this.updateVariantMedia = bind(this.updateVariantMedia, this);
      this.updateMediaListener = bind(this.updateMediaListener, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.product_id = _this.root.attr('data-product-id');
      _this.handle = _this.root.attr('data-handle');
      _this.thumbs_root = _this.root.find('.product-media--root[data-view="thumb-container"]');
      _this.media_root = _this.root.find('.product-media--root[data-view="featured"]').not('[data-media-size="mobile"]');
      if (_this.media_root) {
        _this.magnify = _this.media_root.data('magnify');
        _this.main_media = _this.media_root.find('.product-media--featured');
        _this.media_container = _this.media_root.closest('.product-media--wrapper');
        _this.thumbs = _this.thumbs_root.find('.product-media--thumb');
        _this.zoom_enabled = _this.media_root.data('zoom-enabled');
        _this.zoom_images = _this.media_root.find('.product-media--zoom-image');
      }
      _this.load();
    }

    CoreProduct.prototype.load = function() {
      var _this;
      _this = this;
      if (_this.media_root) {
        _this.updateMediaListener();
      }
      if (_this.zoom_enabled) {
        _this.initZoomListener();
      }
      if (_this.thumbs) {
        _this.thumbNavigation();
      }
      if (_this.handle) {
        return _this.updateRecentList();
      }
    };

    CoreProduct.prototype.updateMediaListener = function() {
      var _this;
      _this = this;
      return _this.root.on('variantUpdated', function(event) {
        var variant, variant_media_id;
        variant = event.detail;
        variant_media_id = 0;
        if (variant.featured_media) {
          variant_media_id = variant.featured_media.id;
        }
        return _this.updateVariantMedia(variant_media_id);
      });
    };

    CoreProduct.prototype.updateVariantMedia = function(variant_media_id) {
      var _this, variant_image, variant_thumb;
      _this = this;
      if (variant_media_id === 0) {
        return;
      }
      _this.main_media.attr('data-active', 'false');
      _this.main_media.parent().hide();
      variant_image = _this.main_media.filter("[data-id='" + variant_media_id + "']");
      variant_image.attr('data-active', 'true');
      variant_image.parent().show();
      _this.thumbs.attr('data-active', 'false');
      variant_thumb = _this.thumbs.filter("[data-id='" + variant_media_id + "']");
      variant_thumb.attr('data-active', 'true');
      if (_this.zoom_enabled) {
        return _this.imageZoom();
      }
    };

    CoreProduct.prototype.imageZoom = function() {
      var _this, active_zoom_image, left_position, magnified_height, magnified_width, top_position, wrapper_height, wrapper_width, x_ratio, y_ratio;
      _this = this;
      active_zoom_image = _this.zoom_images.filter("[data-id='" + (_this.getActiveImageId()) + "']");
      active_zoom_image.css('display', 'none');
      _this.media_container.off('mouseenter.Product.ImageZoom mouseleave.Product.ImageZoom');
      if (_this.main_media.length < 1 || theme.utils.mqs.current_window === 'small') {

      } else if (active_zoom_image.length > 0) {
        _this.media_container.attr('data-media-type', 'image');
        wrapper_width = _this.media_container.width();
        wrapper_height = _this.media_container.height();
        magnified_width = wrapper_width * _this.magnify;
        magnified_height = wrapper_height * _this.magnify;
        left_position = _this.media_container.offset().left;
        top_position = _this.media_container.offset().top;
        active_zoom_image.css('width', magnified_width + "px");
        active_zoom_image.find('.image--root').css('width', magnified_width + "px");
        active_zoom_image.find('img').addClass('lazypreload');
        x_ratio = (magnified_width - wrapper_width) / wrapper_width;
        y_ratio = (magnified_height - wrapper_height) / wrapper_height;
        _this.media_container.on('mouseenter.Product.ImageZoom', function() {
          return active_zoom_image.css('display', 'block');
        });
        _this.media_container.on('mouseleave.Product.ImageZoom', function() {
          return active_zoom_image.css('display', 'none');
        });
        return _this.media_container.on('mousemove', function(event) {
          var relative_left, relative_top;
          relative_left = event.pageX - left_position;
          relative_top = event.pageY - top_position;
          active_zoom_image.css('left', (relative_left * -x_ratio) + "px");
          return active_zoom_image.css('top', (relative_top * -y_ratio) + "px");
        });
      } else {
        return _this.media_container.attr('data-media-type', '');
      }
    };

    CoreProduct.prototype.getActiveImageId = function() {
      var _this, active_image, active_image_id;
      _this = this;
      active_image = _this.main_media.filter('[data-active="true"]');
      return active_image_id = active_image.attr('data-id');
    };

    CoreProduct.prototype.initZoomListener = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.Product', theme.utils.debounce(100, function() {
        return _this.imageZoom();
      }));
    };

    CoreProduct.prototype.thumbNavigation = function() {
      var _this;
      _this = this;
      return _this.thumbs.on('keypress click', function(event) {
        var clicked_id, clicked_media, current_media;
        if (theme.utils.a11yClick(event)) {
          current_media = _this.root.find('.product-media--featured[data-active="true"] > *');
          current_media.trigger('pause-media');
          clicked_id = this.dataset.id;
          clicked_media = _this.root.find(".product-media--featured[data-id='" + clicked_id + "'] > *");
          _this.updateVariantMedia(clicked_id);
          if (theme.utils.mqs.current_window !== 'small') {
            clicked_media.trigger('play-media');
          }
          if (clicked_media.parent().attr('data-media-type') !== 'image') {
            return clicked_media.focus();
          }
        }
      });
    };

    CoreProduct.prototype.updateRecentList = function() {
      var _this, current_product_arr, current_product_str, max_num_recents_stored, newly_visited_product, previous_product_arr, previous_product_str;
      _this = this;
      current_product_arr = [_this.handle];
      previous_product_str = localStorage.getItem(theme.local_storage.recent_products);
      max_num_recents_stored = 4;
      if (previous_product_str) {
        previous_product_arr = JSON.parse(previous_product_str);
        if (previous_product_arr.indexOf(_this.handle) === -1) {
          newly_visited_product = true;
        }
      } else {
        current_product_str = JSON.stringify(current_product_arr);
        localStorage.setItem(theme.local_storage.recent_products, current_product_str);
      }
      if (newly_visited_product) {
        if (previous_product_arr.length === max_num_recents_stored) {
          previous_product_arr = previous_product_arr.slice(1);
        }
        current_product_str = JSON.stringify(previous_product_arr.concat(current_product_arr));
        return localStorage.setItem(theme.local_storage.recent_products, current_product_str);
      }
    };

    CoreProduct.clearQuickAddForms = function(product_id) {
      var right_sidebar;
      if (product_id == null) {
        product_id = '';
      }
      right_sidebar = theme.partials.OffCanvas.right_sidebar;
      return right_sidebar.find(".product--form[data-product-id*='" + product_id + "']").remove();
    };

    CoreProduct.initQuickAddForm = function(quick_add_button) {
      var existing_product_form, new_product_form, product_id, right_sidebar;
      right_sidebar = theme.partials.OffCanvas.right_sidebar;
      right_sidebar.find('.product--form').hide();
      product_id = quick_add_button.getAttribute('data-product-id');
      existing_product_form = right_sidebar.find("[data-product-id='" + product_id + "']");
      if (existing_product_form.length > 0) {
        existing_product_form.show();
        return theme.partials["Product-" + product_id].updateRecentList();
      } else {
        new_product_form = quick_add_button.closest('.product--root').querySelector('.product--form');
        theme.partials["Product-" + product_id] = new theme.classes.Product(el(new_product_form));
        return document.querySelector('[data-view="product-form"]').appendChild(new_product_form);
      }
    };

    CoreProduct.getAvailableQuantity = function(form) {
      var cart_items, cart_quantity, form_id, inventory_quantity, quantity_input, quantity_remaining, requested_quantity, variant, variant_id;
      variant = form.querySelector('option[selected]');
      if (variant.dataset.inventoryManagement !== 'shopify' || variant.dataset.inventoryPolicy === 'continue') {
        return true;
      }
      variant_id = variant.value;
      cart_items = JSON.parse(localStorage.getItem(theme.local_storage.cart_items));
      if (cart_items[variant_id]) {
        cart_quantity = cart_items[variant_id];
      } else {
        cart_quantity = 0;
      }
      form_id = form.getAttribute('id');
      inventory_quantity = parseInt(variant.dataset.inventoryQuantity);
      quantity_remaining = inventory_quantity - cart_quantity;
      quantity_input = document.querySelector(".product-quantity--input[form='" + form_id + "']");
      if (quantity_input) {
        requested_quantity = parseInt(quantity_input.value);
      } else {
        requested_quantity = 1;
      }
      if (quantity_remaining <= 0) {
        quantity_remaining = 0;
        if (quantity_input) {
          quantity_input.value = 1;
        }
      } else if (requested_quantity > quantity_remaining && quantity_input) {
        quantity_input.value = quantity_remaining;
      } else {
        return true;
      }
      theme.classes.Product.triggerQuantityFeedback(quantity_remaining);
      return false;
    };

    CoreProduct.triggerQuantityFeedback = function(quantity_remaining) {
      var message;
      if (quantity_remaining === 0) {
        window.location.hash = '#feedback-bar--product--no-items';
      } else if (quantity_remaining === 1) {
        window.location.hash = '#feedback-bar--product--one-item';
      } else if (quantity_remaining > 1) {
        window.location.hash = '#feedback-bar--product--n-items';
        message = document.querySelector('[data-message="product--n-items"]');
        message.textContent = message.textContent.replace('[num_items]', quantity_remaining);
      }
      return window.dispatchEvent(new Event('theme:feedbackBar:trigger'));
    };

    CoreProduct.quickAddToCart = function(quick_add_button) {
      var product_form, product_root, quantity_available;
      quick_add_button.dataset.loading = true;
      product_root = quick_add_button.closest('.product--root');
      product_form = product_root.querySelector('.product-buy-buttons--form');
      quantity_available = theme.classes.Product.getAvailableQuantity(product_form);
      if (quantity_available) {
        theme.partials.Cart.addItem(product_form, function(success) {
          if (success) {
            return theme.partials.Cart.updateAllHtml(function() {
              quick_add_button.dataset.loading = false;
              if (theme.partials.OffCanvas.state === 'closed') {
                return theme.partials.OffCanvas.openRight();
              }
            });
          } else {
            return quick_add_button.dataset.loading = false;
          }
        });
      } else {
        quick_add_button.dataset.loading = false;
      }
      return theme.window.trigger('resize');
    };

    return CoreProduct;

  })();

  theme.classes.CoreRadios = (function() {
    function CoreRadios(root) {
      var _this;
      this.root = root;
      this.updateLabelOnChange = bind(this.updateLabelOnChange, this);
      this.preventFormSubmitOnEnter = bind(this.preventFormSubmitOnEnter, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_value = _this.root.find('.radios--option-current');
      _this.inputs = _this.root.find('input');
      _this.is_swatches = _this.root.data('is-swatches');
      _this.load();
    }

    CoreRadios.prototype.load = function() {
      var _this;
      _this = this;
      _this.preventFormSubmitOnEnter();
      if (_this.is_swatches) {
        theme.classes.Radios.setSwatchAppearance(_this.inputs);
        if (_this.current_value.length) {
          return _this.updateLabelOnChange();
        }
      }
    };

    CoreRadios.prototype.preventFormSubmitOnEnter = function() {
      var _this;
      _this = this;
      return _this.inputs.on('keydown', function(event) {
        if (event.key === 'Enter') {
          return event.preventDefault();
        }
      });
    };

    CoreRadios.prototype.updateLabelOnChange = function() {
      var _this;
      _this = this;
      return _this.inputs.on('change', function() {
        return _this.current_value.text(this.value);
      });
    };

    CoreRadios.setSwatchAppearance = function(inputs) {
      var _this;
      _this = CoreRadios;
      return inputs.each(function(input) {
        var swatch, swatch_color;
        swatch = input.nextElementSibling;
        swatch_color = input.value.toLowerCase().replace(/\s+/g, '');
        if (theme.swatches[swatch_color] === void 0) {
          return swatch.style['background-color'] = swatch_color;
        } else if (theme.swatches[swatch_color].indexOf('cdn.shopify.com') > -1) {
          return swatch.style['background-image'] = "url(" + theme.swatches[swatch_color] + ")";
        } else {
          return swatch.style['background-color'] = theme.swatches[swatch_color];
        }
      });
    };

    return CoreRadios;

  })();

  theme.classes.CoreRecentProducts = (function() {
    function CoreRecentProducts(root) {
      var _this;
      this.root = root;
      this.hoverImagesLoaded = bind(this.hoverImagesLoaded, this);
      this.matchImageHeights = bind(this.matchImageHeights, this);
      this.resizeListeners = bind(this.resizeListeners, this);
      this.formatProducts = bind(this.formatProducts, this);
      this.checkIfAllProductsLoaded = bind(this.checkIfAllProductsLoaded, this);
      this.renderProductItem = bind(this.renderProductItem, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.current_width = window.innerWidth;
      _this.main_grid = _this.root.find('.recent-products--grid');
      _this.num_errors = 0;
      _this.num_loaded = 0;
      _this.spinner = _this.root.find('.recent-products--spinner');
      _this.storage = JSON.parse(localStorage.getItem(theme.local_storage.recent_products));
      if (_this.storage) {
        _this.load();
      } else {
        _this.root.hide();
      }
    }

    CoreRecentProducts.prototype.load = function() {
      var _this;
      _this = this;
      return _this.storage.forEach(function(handle) {
        return _this.renderProductItem(handle);
      });
    };

    CoreRecentProducts.prototype.renderProductItem = function(handle) {
      var _this, request;
      _this = this;
      request = new XMLHttpRequest();
      request.onload = function() {
        var product_html;
        if (request.status >= 200 && request.status < 300) {
          product_html = theme.utils.parseHtml(request.response, '.product--root');
          _this.main_grid.prepend(product_html);
          return _this.checkIfAllProductsLoaded();
        }
      };
      request.onerror = function() {
        _this.num_errors++;
        if (_this.num_errors === _this.storage.length) {
          return _this.root.hide();
        } else {
          return _this.checkIfAllProductsLoaded();
        }
      };
      request.open("GET", theme.urls.root + "/products/" + handle + "?view=ajax-item");
      return request.send();
    };

    CoreRecentProducts.prototype.checkIfAllProductsLoaded = function() {
      var _this;
      _this = this;
      _this.num_loaded++;
      if (_this.num_loaded === _this.storage.length) {
        _this.main_grid.removeAttr('style');
        _this.spinner.hide();
        return _this.formatProducts();
      }
    };

    CoreRecentProducts.prototype.formatProducts = function() {
      var _this;
      _this = this;
      _this.resizeListeners();
      _this.matchImageHeights();
      theme.utils.loadJsClasses(_this.main_grid);
      if (theme.settings.hover_image_enabled) {
        _this.hoverImagesLoaded();
      }
      if (theme.settings.quick_add) {
        theme.partials.OffCanvas.unload();
        return theme.partials.OffCanvas.load();
      }
    };

    CoreRecentProducts.prototype.resizeListeners = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.RecentProducts', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.matchImageHeights();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    CoreRecentProducts.prototype.matchImageHeights = function() {
      var _this;
      _this = this;
      return theme.utils.matchImageHeights(_this.main_grid, _this.root.find('.product--root'), '.product--image-wrapper');
    };

    CoreRecentProducts.prototype.hoverImagesLoaded = function() {
      var _this;
      _this = this;
      return _this.main_grid.find('.product--hover-image').each(function(hover_image) {
        return theme.utils.imagesLoaded(hover_image, function() {
          var product;
          product = hover_image.closest('[data-hover-image="true"]');
          return product.setAttribute('data-hover-image', 'loaded');
        });
      });
    };

    return CoreRecentProducts;

  })();

  theme.classes.CoreSearch = (function() {
    function CoreSearch(root) {
      var _this;
      this.root = root;
      this.resizeArticleListener = bind(this.resizeArticleListener, this);
      this.matchArticleHeights = bind(this.matchArticleHeights, this);
      this.resizeProductListener = bind(this.resizeProductListener, this);
      this.refineLinkListener = bind(this.refineLinkListener, this);
      this.loadHoverImages = bind(this.loadHoverImages, this);
      this.matchProductHeights = bind(this.matchProductHeights, this);
      this.updateProductsListener = bind(this.updateProductsListener, this);
      this.toggleView = bind(this.toggleView, this);
      this.getResults = bind(this.getResults, this);
      this.listenForKeyEntered = bind(this.listenForKeyEntered, this);
      this.searchLinks = bind(this.searchLinks, this);
      this.onOpen = bind(this.onOpen, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.articles = _this.root.find('.search--articles');
      _this.current_width = window.innerWidth;
      _this.form = _this.root.find('form');
      _this.icon = _this.root.find('.search--icon');
      _this.loading = _this.root.find('.search--loading');
      _this.products = _this.root.find('.search--products');
      _this.results = _this.root.find('.search--results');
      _this.text_box = _this.root.find('.search--textbox');
      _this.toggle_link = _this.root.find('.search--toggle');
      _this.show_articles = _this.root.data('show-articles');
      _this.show_pages = _this.root.data('show-pages');
      _this.view = _this.root.data('view');
      _this.article_page_combination = "";
      _this.num_loaded_views = 0;
      _this.num_pending_views = 0;
      _this.offCanvas = theme.partials.OffCanvas;
      _this.search_trigger = document.querySelector('[data-trigger="search-modal"]');
      _this.typing_timer = null;
      if (_this.show_articles && _this.show_pages) {
        _this.article_page_combination = 'article,page';
      } else if (_this.show_articles) {
        _this.article_page_combination = 'article';
      } else if (_this.show_pages) {
        _this.article_page_combination = 'page';
      }
      _this.load();
    }

    CoreSearch.prototype.load = function() {
      var _this;
      _this = this;
      if (_this.view === 'modal') {
        _this.searchLinks();
        return _this.listenForKeyEntered();
      } else if (_this.view.includes('product')) {
        _this.updateProductsListener();
        _this.resizeProductListener();
        _this.matchProductHeights();
        if (theme.settings.hover_image_enabled && _this.view === 'template-product') {
          return _this.loadHoverImages();
        }
      } else if (_this.view === 'template-article') {
        _this.resizeArticleListener();
        return _this.matchArticleHeights();
      }
    };

    CoreSearch.prototype.onOpen = function() {
      var _this, temp_val;
      _this = this;
      window.scrollTo(0, 0);
      _this.text_box.focus();
      temp_val = _this.text_box.val();
      _this.text_box.val('');
      _this.text_box.val(temp_val);
      return _this.text_box.trigger('keyup');
    };

    CoreSearch.prototype.searchLinks = function() {
      var _this, left_search_links, main_search_links, right_search_links;
      _this = this;
      main_search_links = _this.offCanvas.main_content.find("a[href='" + theme.urls.search + "']");
      main_search_links.on('click', function(event) {
        _this.search_trigger.click();
        _this.onOpen();
        event.preventDefault();
        return event.stopPropagation();
      });
      right_search_links = _this.offCanvas.right_sidebar.find("a[href='" + theme.urls.search + "']");
      right_search_links.on('click', function(event) {
        _this.offCanvas.closeRight();
        setTimeout(function() {
          _this.search_trigger.click();
          return _this.onOpen();
        }, 450);
        event.preventDefault();
        return event.stopPropagation();
      });
      left_search_links = _this.offCanvas.left_sidebar.find("a[href='" + theme.urls.search + "']");
      return left_search_links.on('click', function(event) {
        _this.offCanvas.closeLeft();
        setTimeout(function() {
          _this.search_trigger.click();
          return _this.onOpen();
        }, 450);
        event.preventDefault();
        return event.stopPropagation();
      });
    };

    CoreSearch.prototype.listenForKeyEntered = function() {
      var _this;
      _this = this;
      return _this.text_box.attr("autocomplete", "off").on("keyup paste", function(event) {
        var term;
        clearTimeout(_this.typing_timer);
        term = this.value;
        if (term.length < 2 && event.type !== 'paste') {
          _this.toggleView(false, true);
          return false;
        }
        _this.toggleView(true, true);
        return _this.typing_timer = setTimeout(function() {
          var url;
          clearTimeout(_this.typing_timer);
          if (_this.show_articles || _this.show_pages) {
            _this.num_pending_views = 2;
            url = theme.urls.search + "?view=ajax-article-page&type=" + _this.article_page_combination + "&q=" + term + "*";
            _this.getResults(url, 'article');
          } else {
            _this.num_pending_views = 1;
          }
          url = theme.urls.search + "?view=ajax-product&type=product&q=" + term + "*";
          return _this.getResults(url, 'product');
        }, 750);
      });
    };

    CoreSearch.prototype.getResults = function(url, type) {
      var _this, request;
      _this = this;
      _this.toggleView(true, false);
      request = new XMLHttpRequest();
      request.onload = function() {
        var results_html;
        if (request.status >= 200 && request.status < 300) {
          _this.num_loaded_views += 1;
          results_html = theme.utils.parseHtml(request.response);
          if (type === 'product') {
            _this.products.empty().append(results_html);
            _this.matchProductHeights();
            _this.refineLinkListener();
            theme.utils.loadJsClasses(el('.search--products-container'));
          } else if (type === 'article') {
            _this.articles.empty().append(results_html);
          }
          if (_this.num_loaded_views === _this.num_pending_views) {
            _this.toggleView(false, true);
            return _this.num_loaded_views = 0;
          }
        }
      };
      request.onerror = function() {
        return console.log(request.statusText + ": search.json request failed!");
      };
      request.open("GET", url);
      return request.send();
    };

    CoreSearch.prototype.toggleView = function(toggle_load, toggle_display) {
      var _this;
      _this = this;
      if (toggle_load) {
        _this.loading.show();
        _this.icon.hide();
      } else {
        _this.loading.hide();
        _this.icon.show();
      }
      if (toggle_display) {
        _this.products.css('opacity', '1');
        return _this.articles.css('opacity', '1');
      } else {
        _this.products.css('opacity', '0');
        return _this.articles.css('opacity', '0');
      }
    };

    CoreSearch.prototype.updateProductsListener = function() {
      var _this;
      _this = this;
      return theme.window.on('theme:navigation:productsUpdated', function() {
        _this.matchProductHeights();
        if (theme.settings.hover_image_enabled && _this.view === 'template-product') {
          return _this.loadHoverImages();
        }
      });
    };

    CoreSearch.prototype.matchProductHeights = function() {
      var _this;
      _this = this;
      return theme.utils.matchImageHeights(_this.products, _this.products.find('.product--root'), '.product--image-wrapper');
    };

    CoreSearch.prototype.loadHoverImages = function() {
      var _this;
      _this = this;
      return _this.root.find('.product--hover-image').each(function(hover_image) {
        return theme.utils.imagesLoaded(hover_image, function() {
          var product;
          product = hover_image.closest('[data-hover-image="true"]');
          return product.setAttribute('data-hover-image', 'loaded');
        });
      });
    };

    CoreSearch.prototype.refineLinkListener = function() {
      var _this;
      _this = this;
      return _this.root.find('.search--refine-link').on('click', function(event) {
        var current_url, new_search_url;
        new_search_url = this.dataset.url;
        current_url = "" + location.pathname + location.search;
        if (new_search_url === current_url) {
          theme.partials.CoreModal.close();
          return setTimeout(function() {
            return document.querySelector('[data-toggle-menu="refine-filter"]').click();
          }, 250);
        } else {
          return location.href = new_search_url + "#filter--open";
        }
      });
    };

    CoreSearch.prototype.resizeProductListener = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.Search', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.matchProductHeights();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    CoreSearch.prototype.matchArticleHeights = function() {
      var _this;
      _this = this;
      return theme.utils.matchImageHeights(_this.articles, _this.articles.find('.article--item'), '.article--item--image');
    };

    CoreSearch.prototype.resizeArticleListener = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.Search', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.matchArticleHeights();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    return CoreSearch;

  })();

  theme.classes.CoreSections = (function() {
    function CoreSections() {
      this.deselectBlock = bind(this.deselectBlock, this);
      this.selectBlock = bind(this.selectBlock, this);
      this.deselectSection = bind(this.deselectSection, this);
      this.selectSection = bind(this.selectSection, this);
      this.unload = bind(this.unload, this);
      this.load = bind(this.load, this);
      this.getActiveBlock = bind(this.getActiveBlock, this);
      this.getActiveSection = bind(this.getActiveSection, this);
      this.listeners = bind(this.listeners, this);
      var _this;
      _this = this;
      _this.listeners();
    }

    CoreSections.prototype.listeners = function() {
      var _this;
      _this = this;
      _this.load();
      _this.unload();
      _this.selectSection();
      _this.deselectSection();
      _this.selectBlock();
      return _this.deselectBlock();
    };

    CoreSections.prototype.getActiveSection = function(event) {
      var _this, active_section;
      _this = this;
      active_section = el(event.target).find('[data-section-id]');
      return active_section;
    };

    CoreSections.prototype.getActiveBlock = function(event) {
      var _this, active_block;
      _this = this;
      active_block = el(event.target);
      return active_block;
    };

    CoreSections.prototype.load = function() {
      var _this;
      _this = this;
      return document.addEventListener('shopify:section:load', function(event) {
        var active_section;
        theme.utils.loadJsClasses();
        active_section = _this.getActiveSection(event);
        active_section.trigger('theme:section:load');
        return active_section.find('[data-js-class]').each(function(js_class) {
          return el(js_class).trigger('theme:section:load');
        });
      });
    };

    CoreSections.prototype.unload = function() {
      var _this;
      _this = this;
      return document.addEventListener('shopify:section:unload', function(event) {
        var active_section;
        active_section = _this.getActiveSection(event);
        active_section.trigger('theme:section:unload');
        return active_section.find('[data-js-loaded="true"]').each(function(loaded_class) {
          return el(loaded_class).trigger('theme:section:unload');
        });
      });
    };

    CoreSections.prototype.selectSection = function() {
      var _this;
      _this = this;
      return document.addEventListener('shopify:section:select', function(event) {
        var active_section;
        active_section = _this.getActiveSection(event);
        return active_section.trigger('theme:section:select');
      });
    };

    CoreSections.prototype.deselectSection = function() {
      var _this;
      _this = this;
      return document.addEventListener('shopify:section:deselect', function(event) {
        var active_section;
        active_section = _this.getActiveSection(event);
        return active_section.trigger('theme:section:deselect');
      });
    };

    CoreSections.prototype.selectBlock = function() {
      var _this;
      _this = this;
      return document.addEventListener('shopify:block:select', function(event) {
        var active_block;
        active_block = _this.getActiveBlock(event);
        return active_block.trigger('theme:block:select');
      });
    };

    CoreSections.prototype.deselectBlock = function() {
      var _this;
      _this = this;
      return document.addEventListener('shopify:block:deselect', function(event) {
        var active_block;
        active_block = _this.getActiveBlock(event);
        return active_block.trigger('theme:block:deselect');
      });
    };

    return CoreSections;

  })();

  theme.classes.CoreServiceList = (function() {
    function CoreServiceList(root) {
      var _this;
      this.root = root;
      this.balanceColumns = bind(this.balanceColumns, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.block_list = _this.root.find('.service-list--blocks');
      _this.blocks = _this.root.find('li');
      _this.blocks_container = _this.root.find('.service-list--container');
      _this.headers = _this.root.find('.service-list--block-header');
      _this.single_column = _this.root.find('.service-list--single-column');
      _this.left_column = _this.root.find('.service-list--left-column');
      _this.right_column = _this.root.find('.service-list--right-column');
      _this.load();
    }

    CoreServiceList.prototype.load = function() {
      var _this;
      _this = this;
      return _this.balanceColumns();
    };

    CoreServiceList.prototype.balanceColumns = function() {
      var _this, assignLoopList, isTypeHeader, loop_list, offset, thresholdBreached, with_multiple_headers;
      _this = this;
      offset = _this.root.data('service-list--show-descriptions') === true ? 75 : 0;
      with_multiple_headers = _this.block_list.length > 1 ? true : false;
      isTypeHeader = function(item) {
        return item.hasClass('service-list--block-header');
      };
      thresholdBreached = function() {
        var left_column_height, right_column_height, single_column_height;
        single_column_height = _this.single_column.outerHeight();
        left_column_height = _this.left_column.outerHeight();
        right_column_height = _this.right_column.outerHeight();
        return left_column_height >= parseFloat(right_column_height + single_column_height - offset);
      };
      assignLoopList = function() {
        var blocks;
        if (with_multiple_headers) {
          _this.root.attr('data-has-headers', true);
          return _this.block_list;
        } else {
          blocks = theme.utils.parseHtml('<ul class="service-list--blocks"></ul>');
          _this.left_column.append(blocks);
          return _this.blocks;
        }
      };
      loop_list = assignLoopList();
      return loop_list.each(function(list, index) {
        var list_el;
        list_el = el(list);
        if (thresholdBreached()) {
          _this.right_column.append(_this.single_column.find('.service-list--blocks'));
          return;
        } else {
          if (with_multiple_headers) {
            _this.left_column.append(list_el);
          } else {
            if (isTypeHeader(list_el)) {
              _this.blocks_container.prepend(list_el.find('.service-list--block-header--text'));
              list_el.remove();
            } else {
              _this.left_column.find('.service-list--blocks').append(list_el);
            }
          }
        }
        if (index === loop_list.length - 1 && _this.right_column.isEmpty() && _this.headers.length > 1) {
          return _this.right_column.append(_this.left_column.find('.service-list--blocks').last());
        }
      });
    };

    return CoreServiceList;

  })();

  theme.classes.CoreTabOrder = (function() {
    function CoreTabOrder(mobile_order, desktop_order) {
      var _this;
      this.mobile_order = mobile_order;
      this.desktop_order = desktop_order;
      this.resizeListener = bind(this.resizeListener, this);
      this.disableFocus = bind(this.disableFocus, this);
      this.moveFocus = bind(this.moveFocus, this);
      this.focusOutCallback = bind(this.focusOutCallback, this);
      this.focusListener = bind(this.focusListener, this);
      this.updateOrderList = bind(this.updateOrderList, this);
      this.getElementList = bind(this.getElementList, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.mobile_order_elements = _this.getElementList(_this.mobile_order);
      _this.desktop_order_elements = _this.getElementList(_this.desktop_order);
      _this.load();
    }

    CoreTabOrder.prototype.load = function() {
      var _this;
      _this = this;
      _this.updateOrderList();
      _this.focusListener();
      return _this.resizeListener();
    };

    CoreTabOrder.prototype.getElementList = function(order_list) {
      var _this, order_list_elements;
      _this = this;
      if (order_list) {
        order_list_elements = [];
        order_list.forEach(function(container_class) {
          var container_elements;
          container_elements = document.querySelectorAll(container_class);
          if (container_elements.length) {
            return container_elements.forEach(function(el) {
              return order_list_elements.push(el);
            });
          }
        });
        return order_list_elements;
      } else {
        return false;
      }
    };

    CoreTabOrder.prototype.updateOrderList = function() {
      var _this;
      _this = this;
      if (theme.utils.mqs.current_window === 'small') {
        _this.current_order_elements = _this.mobile_order_elements;
        return _this.previous_order_elements = _this.desktop_order_elements;
      } else {
        _this.current_order_elements = _this.desktop_order_elements;
        return _this.previous_order_elements = _this.mobile_order_elements;
      }
    };

    CoreTabOrder.prototype.focusListener = function() {
      var _this;
      _this = this;
      if (!_this.current_order_elements) {
        return;
      }
      return _this.current_order_elements.forEach(function(element, index) {
        return element.addEventListener('focusout', function(event) {
          return _this.focusOutCallback(this, index, event);
        });
      });
    };

    CoreTabOrder.prototype.focusOutCallback = function(element, index, event) {
      var _this, lost_focus;
      _this = this;
      if (!theme.utils.tabbing) {
        return;
      }
      lost_focus = !element.contains(event.relatedTarget) && theme.partials.OffCanvas.state === 'closed';
      if (lost_focus && theme.utils.tab_forwards) {
        return _this.moveFocus(index + 1, 'forwards');
      } else if (lost_focus) {
        return _this.moveFocus(index - 1, 'backwards');
      }
    };

    CoreTabOrder.prototype.moveFocus = function(index, direction) {
      var _this, focusable_elements, move_to;
      _this = this;
      move_to = _this.current_order_elements[index];
      focusable_elements = theme.utils.getFocusableEl(move_to);
      if (index < _this.current_order_elements.length && direction === 'forwards') {
        if (focusable_elements) {
          focusable_elements[0].focus();
        } else if ((index + 1) < _this.current_order_elements.length) {
          _this.moveFocus(index + 1, 'forwards');
        }
      }
      if (index >= 0 && direction === 'backwards') {
        if (focusable_elements) {
          return focusable_elements[focusable_elements.length - 1].focus();
        } else if ((index - 1) >= 0) {
          return _this.moveFocus(index - 1, 'backwards');
        }
      }
    };

    CoreTabOrder.prototype.disableFocus = function() {
      var _this;
      _this = this;
      if (!_this.previous_order_elements) {
        return;
      }
      return _this.previous_order_elements.forEach(function(element) {
        return element.removeEventListener('focusout', function(event) {
          return _this.focusOutCallback(this, index, event);
        });
      });
    };

    CoreTabOrder.prototype.resizeListener = function() {
      var _this;
      _this = this;
      return window.addEventListener('theme:utils:mqs:updated', function() {
        _this.updateOrderList();
        _this.focusListener();
        return _this.disableFocus();
      });
    };

    return CoreTabOrder;

  })();

  theme.classes.Transition = (function() {
    function Transition(root) {
      var _this;
      this.root = root;
      this.transitionListeners = bind(this.transitionListeners, this);
      this.updateState = bind(this.updateState, this);
      this.setState = bind(this.setState, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.state = 'at_start';
      _this.load();
    }

    Transition.prototype.load = function() {
      var _this;
      _this = this;
      _this.setState(_this.state);
      return _this.transitionListeners();
    };

    Transition.prototype.setState = function(state) {
      var _this;
      _this = this;
      _this.root.setAttribute('data-transition', state);
      return _this.state = state;
    };

    Transition.prototype.updateState = function() {
      var _this;
      _this = this;
      return _this.state = _this.root.getAttribute('data-transition');
    };

    Transition.prototype.transitionListeners = function() {
      var _this;
      _this = this;
      return _this.root.on('transitionend', function() {
        _this.updateState();
        if (_this.state === 'forwards') {
          _this.setState('at_end');
          return _this.root.trigger('transition:at_end');
        } else if (_this.state === 'backwards') {
          _this.setState('at_start');
          return _this.root.trigger('transition:at_start');
        }
      });
    };

    return Transition;

  })();

  theme.classes.CoreUtils = (function() {
    function CoreUtils() {
      this.isTouchDevice = bind(this.isTouchDevice, this);
      this.loadJsClasses = bind(this.loadJsClasses, this);
      this.checkFlexBoxGap = bind(this.checkFlexBoxGap, this);
      this.getHiddenElHeight = bind(this.getHiddenElHeight, this);
      this.detectTabDirection = bind(this.detectTabDirection, this);
      this.detectTabbing = bind(this.detectTabbing, this);
      var _this;
      _this = this;
      _this.mqs = new theme.classes.CoreMediaQueries();
      _this.checkFlexBoxGap();
      _this.detectTabbing();
      _this.detectTabDirection();
    }

    CoreUtils.prototype.swipe = function() {
      var _this;
      _this = this;
      _this.disable_prevent_scroll = false;
      _this.disable_swipe_listener = false;
      document.querySelectorAll('input, textarea').forEach(function(input) {
        input.addEventListener('focus', function() {
          return _this.disable_prevent_scroll = true;
        });
        return input.addEventListener('blur', function() {
          return _this.disable_prevent_scroll = false;
        });
      });
      SwipeListener(document, {
        preventScroll: function(event) {
          var x_swipe_distance, y_swipe_distance;
          if (_this.disable_prevent_scroll) {
            return;
          }
          x_swipe_distance = Math.abs(event.detail.x[0] - event.detail.x[1]);
          y_swipe_distance = Math.abs(event.detail.y[0] - event.detail.y[1]) * 2;
          if (x_swipe_distance > y_swipe_distance) {
            return true;
          } else {
            return false;
          }
        }
      });
      return document.addEventListener('swipe', function(event) {
        var directions, swipe_event;
        if (_this.disable_swipe_listener) {
          return;
        }
        directions = event.detail.directions;
        if (directions.left) {
          swipe_event = new Event('theme:swipe:left');
        }
        if (directions.right) {
          swipe_event = new Event('theme:swipe:right');
        }
        if (directions.top) {
          swipe_event = new Event('theme:swipe:up');
        }
        if (directions.bottom) {
          swipe_event = new Event('theme:swipe:down');
        }
        return document.dispatchEvent(swipe_event);
      });
    };

    CoreUtils.prototype.a11yClick = function(event) {
      var code;
      if (event.type === 'click') {
        return true;
      } else if (event.type === 'keypress') {
        code = event.charCode || event.keyCode;
        if (code === 32) {
          event.preventDefault();
        }
        if (code === 32 || code === 13) {
          return true;
        }
      }
      return false;
    };

    CoreUtils.prototype.detectTabbing = function() {
      var _this;
      _this = this;
      theme.window.on('click load', function() {
        _this.tabbing = false;
        return theme.body.attr('data-tabbing', _this.tabbing);
      });
      return window.addEventListener('keydown', function(event) {
        if (event.which === 9 || event.which === 37 || event.which === 38 || event.which === 39 || event.which === 40 || event.which === 27) {
          _this.tabbing = true;
          return theme.body.attr('data-tabbing', _this.tabbing);
        }
      });
    };

    CoreUtils.prototype.detectTabDirection = function() {
      var _this;
      _this = this;
      _this.tab_forwards = null;
      return document.addEventListener('keydown', function(event) {
        _this.tab_forwards = true;
        if (event.which === 9 && event.shiftKey) {
          _this.tab_forwards = false;
        }
        return true;
      });
    };

    CoreUtils.prototype.getFocusableEl = function(container) {
      var _this, focusable_elements, focusable_selectors, ignore_mq;
      _this = this;
      if (!container) {
        return;
      }
      if (_this.mqs.current_window === 'small') {
        ignore_mq = ":not([data-mq='medium-large']):not([data-mq='medium']):not([data-mq='large'])";
      } else if (_this.mqs.current_window === 'medium') {
        ignore_mq = ":not([data-mq='small']):not([data-mq='large'])";
      } else if (_this.mqs.current_window === 'large') {
        ignore_mq = ":not([data-mq='small-medium']):not([data-mq='small']):not([data-mq='medium'])";
      }
      focusable_selectors = "button:not([disabled]):not([aria-hidden='true']), [href]" + ignore_mq + ", input:not([type='hidden']):not([disabled]):not([aria-hidden='true']), select:not([disabled]):not([data-mq='none']):not([aria-hidden='true']), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])" + ignore_mq;
      if (container.isDOMobject && container.length) {
        return focusable_elements = container.find(focusable_selectors);
      } else if (container.isDOMobject !== true) {
        return focusable_elements = container.querySelectorAll(focusable_selectors);
      }
    };

    CoreUtils.prototype.stylesheetLoaded = function() {
      var stylesheetPromise;
      return stylesheetPromise = new Promise(function(resolve) {
        var link;
        link = document.querySelector("link[href='" + theme.assets.stylesheet + "']");
        if (link.loaded) {
          resolve();
        }
        return link.addEventListener('load', function() {
          return setTimeout(resolve, 0);
        });
      });
    };

    CoreUtils.prototype.parseHtml = function(html_string, selector, vanilla) {
      var container, parsed_element;
      if (vanilla == null) {
        vanilla = false;
      }
      container = document.createElement("div");
      container.innerHTML = html_string;
      if (!selector) {
        selector = ':scope > *';
      }
      if (vanilla) {
        parsed_element = container.querySelector(selector);
      } else {
        parsed_element = el(selector, container);
      }
      if (vanilla) {
        return parsed_element;
      } else if (parsed_element.length) {
        return parsed_element;
      } else {
        return false;
      }
    };

    CoreUtils.prototype.getHiddenElHeight = function(element, fixed_width) {
      var cloned_el, el_height, el_padding, el_width;
      if (fixed_width == null) {
        fixed_width = true;
      }
      el_padding = element.css('padding');
      cloned_el = element.clone();
      cloned_el.css('visibility', 'hidden');
      cloned_el.css('display', 'block');
      cloned_el.css('position', 'absolute');
      cloned_el.css('padding', el_padding);
      if (fixed_width) {
        el_width = element.width();
        cloned_el.css('width', el_width + "px");
      }
      theme.body.append(cloned_el);
      el_height = cloned_el.height();
      cloned_el.remove();
      return el_height;
    };

    CoreUtils.prototype.debounce = function(delay, fn) {
      var timeoutId;
      timeoutId = void 0;
      return function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(fn.bind(this), delay, arguments);
      };
    };

    CoreUtils.prototype.imagesLoaded = function(container, callback) {
      var count, images_length;
      count = 0;
      images_length = container.querySelectorAll('img[data-sizes="auto"]').length;
      if (images_length < 1) {
        callback();
        return;
      }
      return container.addEventListener('lazybeforeunveil', function(event) {
        return event.target.addEventListener('load', function() {
          count++;
          if (count === images_length) {
            return callback();
          }
        });
      });
    };

    CoreUtils.prototype.checkFlexBoxGap = function() {
      var flex, is_supported;
      flex = document.createElement("div");
      flex.style.display = "flex";
      flex.style.flexDirection = "column";
      flex.style.rowGap = "1px";
      flex.appendChild(document.createElement("div"));
      flex.appendChild(document.createElement("div"));
      document.body.appendChild(flex);
      is_supported = flex.scrollHeight > 0;
      flex.parentNode.removeChild(flex);
      if (!is_supported) {
        document.documentElement.classList.remove("flexbox-gap");
        return document.documentElement.classList.add("no-flexbox-gap");
      }
    };

    CoreUtils.prototype.loadJsClasses = function(container) {
      var _this;
      if (container == null) {
        container = theme.body;
      }
      _this = this;
      return container.find('[data-js-class]').each(function(js_element) {
        var js_class, js_el, partial_class;
        js_el = el(js_element);
        js_class = js_el.attr('data-js-class');
        if (!js_el.data('js-loaded')) {
          partial_class = theme.classes[js_class];
          if (typeof partial_class !== 'undefined') {
            theme.partials[js_class] = new partial_class(js_el);
            return js_el.attr('data-js-loaded', 'true');
          }
        }
      });
    };

    CoreUtils.prototype.matchImageHeights = function(container, items, image_class, items_to_ignore) {
      var _this, current_row, extra_ignore_blocks, greatest_image_height, ignore_item_rows, ignore_item_widths, image_roots, images, items_per_row, row_items;
      if (items_to_ignore == null) {
        items_to_ignore = false;
      }
      _this = this;
      if (!items.length) {
        return;
      }
      images = items.find(image_class + ", .placeholder--root").css('height', 'auto');
      image_roots = items.find(image_class + " .image--root, .placeholder--root");
      items_per_row = Math.floor(container.width() / image_roots.width());
      if (isNaN(items_per_row)) {
        return;
      }
      if (items_to_ignore) {
        ignore_item_rows = [];
        ignore_item_widths = [];
        extra_ignore_blocks = 0;
        items_to_ignore.each(function(item) {
          var item_el, row, width;
          item_el = el(item);
          row = Math.floor((extra_ignore_blocks + item_el.index()) / items_per_row) + 1;
          width = Math.floor(item_el.width() / image_roots.width());
          extra_ignore_blocks += width - 1;
          if (ignore_item_rows.includes(row)) {
            return ignore_item_widths[ignore_item_rows.indexOf(row)] += width;
          } else {
            ignore_item_rows.push(row);
            return ignore_item_widths.push(width);
          }
        });
      }
      row_items = el();
      current_row = 1;
      greatest_image_height = 0;
      return items.each(function(item, index) {
        var end_of_row, item_el, number_items_to_skip, this_height;
        item_el = el(item);
        if (item_el.find('.image--root').length > 0) {
          this_height = item_el.find(image_class + " .image--root").outerHeight();
        } else {
          this_height = item_el.find('.placeholder--root').outerHeight();
        }
        if (this_height > greatest_image_height) {
          greatest_image_height = this_height;
        }
        end_of_row = false;
        row_items = row_items.add(item_el);
        if (index + 1 === items.length) {
          end_of_row = true;
        } else if (items_to_ignore && ignore_item_rows.includes(current_row)) {
          number_items_to_skip = ignore_item_widths[ignore_item_rows.indexOf(current_row)];
          if (number_items_to_skip === items_per_row) {
            current_row++;
          } else {
            end_of_row = (row_items.length + number_items_to_skip) === items_per_row;
          }
          if (number_items_to_skip === 1 && items_per_row === 1) {
            end_of_row = true;
          }
        } else if (row_items.length === items_per_row) {
          end_of_row = true;
        }
        if (end_of_row) {
          row_items.find(image_class + ", .placeholder--root").height(greatest_image_height);
          row_items = el();
          current_row++;
          return greatest_image_height = 0;
        }
      });
    };

    CoreUtils.prototype.insertStylesheet = function(src) {
      var _this, stylesheet;
      _this = this;
      stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = src;
      return document.head.appendChild(stylesheet);
    };

    CoreUtils.prototype.formatMoney = function(raw_amount) {
      var _this, formatWithSeperators, formatted_amount, money_format, regex;
      _this = this;
      regex = /\{\{\s*(\w+)\s*\}\}/;
      money_format = theme.shop.money_format.match(regex)[1];
      formatWithSeperators = function(amount_in_cents, decimal_places, swap_seperators) {
        var amount_components, cents, cents_seperator, dollars, thousand_seperator;
        thousand_seperator = swap_seperators ? '.' : ',';
        cents_seperator = swap_seperators ? ',' : '.';
        amount_components = (amount_in_cents / 100).toFixed(decimal_places).split('.');
        cents = amount_components[1] ? cents_seperator + amount_components[1] : '';
        dollars = amount_components[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousand_seperator);
        return dollars + cents;
      };
      switch (money_format) {
        case 'amount':
          formatted_amount = formatWithSeperators(raw_amount, 2, false);
          break;
        case 'amount_no_decimals':
          formatted_amount = formatWithSeperators(raw_amount, 0, false);
          break;
        case 'amount_with_comma_separator':
          formatted_amount = formatWithSeperators(raw_amount, 2, true);
          break;
        case 'amount_no_decimals_with_comma_separator':
          formatted_amount = formatWithSeperators(raw_amount, 0, true);
      }
      return theme.shop.money_format.replace(regex, formatted_amount);
    };

    CoreUtils.prototype.isTouchDevice = function() {
      var _this;
      _this = this;
      if (window.matchMedia("(pointer: coarse)").matches) {
        return true;
      } else {
        return false;
      }
    };

    return CoreUtils;

  })();

  theme.classes.CoreXMenu = (function() {
    function CoreXMenu(root) {
      var _this;
      this.root = root;
      this.transitionListeners = bind(this.transitionListeners, this);
      this.slideUp = bind(this.slideUp, this);
      this.slideDown = bind(this.slideDown, this);
      this.arrangeMegaNav = bind(this.arrangeMegaNav, this);
      this.resizeListeners = bind(this.resizeListeners, this);
      this.checkOverlap = bind(this.checkOverlap, this);
      this.listeners = bind(this.listeners, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.debugging = false;
      _this.current_width = window.innerWidth;
      _this.state = 'closed';
      _this.parent_links = _this.root.find('.x-menu--level-1--link > a');
      _this.sub_menu_links = _this.root.find('.x-menu--level-1--link:not([data-x-menu--depth="1"]) > a');
      _this.sub_menu_items = _this.sub_menu_links.parent().find('ul a');
      _this.parents_with_sub_menu = _this.sub_menu_links.parent();
      _this.overlap_parent = _this.root.data('x-menu--overlap-parent');
      _this.header_root = el('.header--root');
      _this.load();
    }

    CoreXMenu.prototype.load = function() {
      var _this;
      _this = this;
      _this.arrangeMegaNav();
      _this.listeners();
      _this.checkOverlap();
      _this.resizeListeners();
      return _this.transitionListeners();
    };

    CoreXMenu.prototype.listeners = function() {
      var _this, sub_menu;
      _this = this;
      _this.parents_with_sub_menu.find('> a').on('mouseenter.XMenu', function() {
        return _this.slideDown(el(this));
      });
      _this.parents_with_sub_menu.on('mouseleave.XMenu', function() {
        return _this.slideUp();
      });
      _this.parent_links.on('focus', function() {
        return _this.slideUp();
      });
      _this.sub_menu_links.on('focus', function() {
        return _this.slideDown(el(this));
      });
      _this.sub_menu_links.on('touchstart.XMenu', function(event) {
        var link_el;
        event.preventDefault();
        link_el = el(this);
        if (link_el.parent().data('x-menu--open')) {
          return _this.slideUp();
        } else {
          return _this.slideDown(link_el);
        }
      });
      return sub_menu = el('.x-menu--level-2--container');
    };

    CoreXMenu.prototype.checkOverlap = function() {
      var _this, center_index, center_item, center_item_left_edge, center_item_right_edge, center_item_width, container, container_width, first_center_child, last_center_child, left_break_point, left_item, right_item, right_item_edge;
      _this = this;
      if (theme.utils.isTouchDevice() && theme.utils.mqs.current_window !== 'large') {
        _this.root.attr('data-x-menu--overlap', 'true');
        _this.header_root.attr('data-x-menu--overlap', 'true');
        theme.window.trigger('theme:x-menu:loaded');
        return false;
      }
      _this.root.attr('data-x-menu--overlap', 'false');
      _this.header_root.attr('data-x-menu--overlap', 'false');
      center_item = _this.root;
      if (_this.overlap_parent === 1) {
        center_item = center_item.parent();
      } else if (_this.overlap_parent === 2) {
        center_item = center_item.parent().parent();
      }
      container = center_item.parent();
      center_index = center_item.index();
      left_item = false;
      if (center_index > 1) {
        left_item = container.children().eq(center_index - 1);
      }
      right_item = false;
      if (center_index + 1 < container.children().length) {
        right_item = container.children().eq(center_index + 1);
      }
      container_width = container.width();
      center_item_width = _this.root.outerWidth();
      if (left_item) {
        first_center_child = center_item.find('> :first-child');
        center_item_left_edge = first_center_child.offset().left - 1;
        left_break_point = (container_width - center_item_width) / 2;
        if (left_edge >= center_item_left_edge) {
          _this.root.attr('data-x-menu--overlap', 'true');
          _this.header_root.attr('data-x-menu--overlap', 'true');
        }
      }
      if (right_item) {
        last_center_child = center_item.find('> :last-child');
        center_item_right_edge = last_center_child.outerWidth() + last_center_child.offset().left + 1;
        right_item_edge = right_item.offset().left;
        if (center_item_right_edge >= right_item_edge) {
          _this.root.attr('data-x-menu--overlap', 'true');
          _this.header_root.attr('data-x-menu--overlap', 'true');
        }
      }
      return theme.window.trigger('theme:x-menu:loaded');
    };

    CoreXMenu.prototype.resizeListeners = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.XMenu', theme.utils.debounce(100, function() {
        if (_this.current_width !== window.innerWidth) {
          _this.checkOverlap();
          return _this.current_width = window.innerWidth;
        }
      }));
    };

    CoreXMenu.prototype.arrangeMegaNav = function() {
      var _this, mega_navs;
      _this = this;
      if (_this.parents_with_sub_menu.length === 0) {
        return false;
      }
      mega_navs = _this.root.find('[data-x-menu--depth="3"] .x-menu--level-2--container');
      return mega_navs.each(function(nav) {
        var container, empty_list, single_parents, single_parents_container;
        container = el(nav);
        single_parents = container.find('[data-x-menu--single-parent="true"]');
        if (single_parents.length > 0) {
          single_parents_container = theme.utils.parseHtml('<div class="x-menu--single-parents"></div>');
          container.prepend(single_parents_container);
          empty_list = theme.utils.parseHtml('<ul>');
          return single_parents_container.append(empty_list).find('ul').append(single_parents);
        }
      });
    };

    CoreXMenu.prototype.slideDown = function(link, delay) {
      var _this, closest_link_parent, link_wrapper, sub_menu;
      if (delay == null) {
        delay = false;
      }
      _this = this;
      clearTimeout(_this.timer);
      link_wrapper = link.parent();
      if (link_wrapper.data('x-menu--open') || _this.state === 'closing') {
        return false;
      }
      _this.slideUp(false);
      if (delay && delay !== 'complete') {
        _this.timer = setTimeout(function() {
          return _this.slideDown(link, 'complete');
        }, delay);
      } else {
        closest_link_parent = link.closest('.x-menu--level-1--link');
        closest_link_parent.find('.icon--chevron-up').css('display', 'inline');
        closest_link_parent.find('.icon--chevron-down').hide();
        closest_link_parent.find('.icon--minus').show();
        closest_link_parent.find('.icon--plus').hide();
        link_wrapper.attr('data-x-menu--open', 'true');
        link.attr('aria-expanded', 'true');
        sub_menu = closest_link_parent.find('.x-menu--level-2--container');
        sub_menu.attr('data-transition', 'forwards');
        sub_menu.css('height', 'auto');
        _this.state = 'open';
      }
    };

    CoreXMenu.prototype.slideUp = function(delay) {
      var _this, closest_link_parent, link, link_wrapper, sub_menu;
      if (delay == null) {
        delay = 300;
      }
      _this = this;
      if (_this.debugging) {
        return false;
      }
      link_wrapper = _this.parents_with_sub_menu.filter('[data-x-menu--open="true"]');
      link = link_wrapper.find('> a');
      if (!link_wrapper.data('x-menu--open')) {
        return false;
      }
      if (delay) {
        return _this.timer = setTimeout(function() {
          return _this.slideUp(false);
        }, delay);
      } else {
        closest_link_parent = link.closest('.x-menu--level-1--link');
        closest_link_parent.find('.icon--chevron-up').hide();
        closest_link_parent.find('.icon--chevron-down').css('display', 'inline');
        closest_link_parent.find('.icon--minus').hide();
        closest_link_parent.find('.icon--plus').show();
        sub_menu = closest_link_parent.find('.x-menu--level-2--container');
        link_wrapper.attr('data-x-menu--open', 'false');
        link.attr('aria-expanded', 'false');
        return sub_menu.attr('data-transition', 'backwards');
      }
    };

    CoreXMenu.prototype.transitionListeners = function() {
      var _this;
      _this = this;
      return _this.sub_menu_links.each(function(sub_links) {
        var menu, sub_menu_containers;
        menu = el(sub_links).parent();
        if (menu !== void 0) {
          sub_menu_containers = menu.find('.x-menu--level-2--container');
          return sub_menu_containers.on('transition:at_start', function() {
            return this.style.height = '0';
          });
        }
      });
    };

    return CoreXMenu;

  })();

  theme.classes.CoreYMenu = (function() {
    function CoreYMenu(root) {
      var _this;
      this.root = root;
      this.slideRight = bind(this.slideRight, this);
      this.slideLeft = bind(this.slideLeft, this);
      this.adjustHeight = bind(this.adjustHeight, this);
      this.listeners = bind(this.listeners, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.state = 'closed';
      _this.sub_menu_links = _this.root.find('.icon--chevron-right--small').parent();
      _this.back_links = _this.root.find('.y-menu--back-link a');
      _this.regular_links = _this.root.find('.y-menu--level-1--link > a:not([data-submenu="true"]), .y-menu--level-2--link > a:not([data-submenu="true"]), .y-menu--level-3--link > a:not([data-submenu="true"])');
      _this.timer = null;
      _this.load();
    }

    CoreYMenu.prototype.load = function() {
      var _this;
      _this = this;
      return _this.listeners();
    };

    CoreYMenu.prototype.listeners = function() {
      var _this;
      _this = this;
      _this.regular_links.on('click', function() {
        var href;
        href = el(this).attr('href');
        if (href.indexOf('#') !== -1) {
          if (theme.partials.OffCanvas.state === 'left--opened') {
            theme.partials.OffCanvas.closeLeft();
          } else if (theme.partials.OffCanvas.state === 'right--opened') {
            theme.partials.OffCanvas.closeRight();
          }
          setTimeout(function() {
            return window.location.href = href;
          }, 450);
        }
      });
      _this.sub_menu_links.on('click', function(event) {
        _this.slideLeft(el(this));
        event.preventDefault();
        return event.stopPropagation();
      });
      return _this.back_links.on('click', function(event) {
        _this.slideRight(el(this));
        event.preventDefault();
        return event.stopPropagation();
      });
    };

    CoreYMenu.prototype.adjustHeight = function(open_list) {
      var _this, current_height, open_list_height;
      _this = this;
      open_list_height = open_list.outerHeight();
      current_height = _this.root.outerHeight();
      _this.root.height(current_height);
      if (open_list.css('position') === 'absolute') {
        open_list.css('position', 'relative');
        open_list_height = open_list.outerHeight();
        open_list.css('position', 'absolute');
      }
      return _this.root.height(open_list_height);
    };

    CoreYMenu.prototype.slideLeft = function(link) {
      var _this, sub_menu;
      _this = this;
      sub_menu = link.closest('li').find('ul').first();
      sub_menu.css('display', 'block');
      _this.adjustHeight(sub_menu);
      return sub_menu.css('transform', 'translateX(-100%)');
    };

    CoreYMenu.prototype.slideRight = function(link, close) {
      var _this, container, parent_container;
      _this = this;
      container = link.closest('ul');
      parent_container = container.parent().closest('ul');
      _this.adjustHeight(parent_container);
      return container.css('transform', 'translateX(0)');
    };

    return CoreYMenu;

  })();

  theme.classes.Blog = (function(superClass) {
    extend(Blog, superClass);

    function Blog() {
      return Blog.__super__.constructor.apply(this, arguments);
    }

    return Blog;

  })(theme.classes.CoreBlog);

  theme.classes.Cart = (function(superClass) {
    extend(Cart, superClass);

    function Cart() {
      this.updateTotalsComplete = bind(this.updateTotalsComplete, this);
      return Cart.__super__.constructor.apply(this, arguments);
    }

    Cart.prototype.updateTotalsComplete = function(count) {
      return document.querySelector('.header--cart-number').dataset.itemCount = count;
    };

    return Cart;

  })(theme.classes.CoreCart);

  theme.classes.Collection = (function(superClass) {
    extend(Collection, superClass);

    function Collection() {
      return Collection.__super__.constructor.apply(this, arguments);
    }

    return Collection;

  })(theme.classes.CoreCollection);

  theme.classes.Disclosure = (function(superClass) {
    extend(Disclosure, superClass);

    function Disclosure() {
      return Disclosure.__super__.constructor.apply(this, arguments);
    }

    return Disclosure;

  })(theme.classes.CoreDisclosure);

  theme.classes.FeaturedBlog = (function(superClass) {
    extend(FeaturedBlog, superClass);

    function FeaturedBlog() {
      return FeaturedBlog.__super__.constructor.apply(this, arguments);
    }

    return FeaturedBlog;

  })(theme.classes.CoreFeaturedBlog);

  theme.classes.FeaturedCollection = (function(superClass) {
    extend(FeaturedCollection, superClass);

    function FeaturedCollection() {
      return FeaturedCollection.__super__.constructor.apply(this, arguments);
    }

    return FeaturedCollection;

  })(theme.classes.CoreFeaturedCollection);

  theme.classes.FeaturedVideo = (function(superClass) {
    extend(FeaturedVideo, superClass);

    function FeaturedVideo() {
      return FeaturedVideo.__super__.constructor.apply(this, arguments);
    }

    return FeaturedVideo;

  })(theme.classes.CoreFeaturedVideo);

  theme.classes.Footer = (function(superClass) {
    extend(Footer, superClass);

    function Footer() {
      return Footer.__super__.constructor.apply(this, arguments);
    }

    return Footer;

  })(theme.classes.CoreFooter);

  theme.classes.Header = (function() {
    function Header(root) {
      var _this;
      this.root = root;
      this.moveYMenu = bind(this.moveYMenu, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.mobile_nav_menu = el('.mobile-nav--menu');
      _this.y_menu = _this.root.find('.y-menu');
      _this.load();
    }

    Header.prototype.load = function() {
      var _this;
      _this = this;
      _this.moveYMenu();
      if (el('.modal.window').css('display') === 'block') {
        el('.modal.window .close').trigger('click');
      }
      return _this.root.on('theme:section:load', function() {
        theme.partials.OffCanvas.unload();
        return theme.partials.OffCanvas.load();
      });
    };

    Header.prototype.moveYMenu = function() {
      var _this;
      _this = this;
      _this.mobile_nav_menu.empty();
      if (_this.mobile_nav_menu.length && _this.y_menu.length) {
        return _this.mobile_nav_menu.append(_this.y_menu);
      }
    };

    return Header;

  })();

  theme.classes.ListCollections = (function(superClass) {
    extend(ListCollections, superClass);

    function ListCollections() {
      return ListCollections.__super__.constructor.apply(this, arguments);
    }

    return ListCollections;

  })(theme.classes.CoreListCollections);

  theme.classes.Map = (function(superClass) {
    extend(Map, superClass);

    function Map() {
      return Map.__super__.constructor.apply(this, arguments);
    }

    return Map;

  })(theme.classes.CoreMap);

  theme.classes.Navigation = (function(superClass) {
    extend(Navigation, superClass);

    function Navigation() {
      return Navigation.__super__.constructor.apply(this, arguments);
    }

    return Navigation;

  })(theme.classes.CoreNavigation);

  theme.classes.OffCanvas = (function(superClass) {
    extend(OffCanvas, superClass);

    function OffCanvas() {
      return OffCanvas.__super__.constructor.apply(this, arguments);
    }

    return OffCanvas;

  })(theme.classes.CoreOffCanvas);

  theme.classes.Popup = (function() {
    function Popup(root) {
      var _this;
      this.root = root;
      _this = this;
      _this.container = _this.root.find('.popup--container');
      _this.open_link = el('.popup--open');
      _this.close_link = _this.root.find('.popup--close');
      _this.show_again_after = _this.root.data('show-again-after');
      _this.mode = _this.root.data('mode');
      _this.newsletter_form = _this.root.find('#contact_form');
      _this.eventListeners();
      _this.autoPopup();
    }

    Popup.prototype.eventListeners = function() {
      var _this;
      _this = this;
      _this.open_link.on('keypress.Popup, click.Popup', function() {
        if (theme.body.data('popup-open')) {
          _this.close();
        } else {
          _this.open();
        }
        return false;
      });
      _this.close_link.on('keypress.Popup, click.Popup', function() {
        _this.close();
        return false;
      });
      return _this.newsletter_form.on('submit', function(event) {
        var form, list_blank_el, list_success_el;
        form = el(this);
        form.find('.error, .success').remove();
        event.preventDefault();
        if (form.find('input[type="email"]').val().length === 0) {
          list_blank_el = theme.utils.parseHtml("<p class='error'>" + theme.translations.mailing_list_email_blank + "</p>");
          form.prepend(list_blank_el);
          return false;
        } else {
          form.find('input[type="email"], input[type="submit"]').hide();
          list_success_el = theme.utils.parseUtil("<p class='success'>" + theme.translations.mailing_list_success_message + "</p>");
          form.prepend(list_success_el).show();
          setTimeout(function() {
            return form.submit();
          }, 500);
        }
        return false;
      });
    };

    Popup.prototype.open = function(source) {
      var _this;
      _this = this;
      _this.container.attr('aria-hidden', false);
      _this.container.attr('data-transition', 'forwards');
      theme.body.attr('data-popup-open', true);
      return theme.body.css('padding-bottom', (_this.container.outerHeight()) + "px");
    };

    Popup.prototype.delayUntilValidScrollPosition = function() {
      var _this;
      _this = this;
      return theme.window.on("DOMMouseScroll.Popup mousewheel.Popup touchmove.Popup scroll.Popup touchmove.Popup", function() {
        var header_offset, scroll_top;
        header_offset = el('.header').offset().top;
        scroll_top = window.pageYOffset;
        if (scroll_top > header_offset) {
          _this.open();
          return theme.window.off("DOMMouseScroll.Popup mousewheel.Popup touchmove.Popup scroll.Popup touchmove.Popup");
        }
      });
    };

    Popup.prototype.close = function() {
      var _this;
      _this = this;
      theme.body.css('padding-bottom', 0);
      theme.body.attr('data-popup-open', false);
      _this.container.attr('data-transition', 'backwards');
      return _this.container.attr('aria-hidden', true);
    };

    Popup.prototype.autoPopup = function() {
      var _this;
      _this = this;
      if (_this.mode === 'manual') {
        return;
      }
      if (!localStorage || _this.mode === 'test') {
        return setTimeout(function() {
          return _this.open('auto');
        }, 1000);
      } else if (localStorage[theme.local_storage.popup] === void 0) {
        _this.setResetTime();
        return setTimeout(function() {
          return _this.open('auto');
        }, 1000);
      } else if (_this.readyToReset()) {
        _this.setResetTime();
        return setTimeout(function() {
          return _this.open('auto');
        }, 1000);
      }
    };

    Popup.prototype.readyToReset = function() {
      var _this, expires, now;
      _this = this;
      expires = JSON.parse(localStorage[theme.local_storage.popup]).popup_expires;
      now = new Date().getTime();
      if (parseFloat(expires - now) <= 0) {
        _this.setResetTime();
        return true;
      }
      return false;
    };

    Popup.prototype.setResetTime = function() {
      var _this, date, expires, object, seconds_from_now;
      _this = this;
      date = new Date();
      seconds_from_now = 1000 * 60 * 60 * 24 * _this.show_again_after;
      expires = date.setTime(date.getTime() + seconds_from_now);
      object = {
        popup_expires: expires
      };
      localStorage[theme.local_storage.popup] = JSON.stringify(object);
      return _this;
    };

    return Popup;

  })();

  theme.classes.ProductModel = (function(superClass) {
    extend(ProductModel, superClass);

    function ProductModel() {
      return ProductModel.__super__.constructor.apply(this, arguments);
    }

    return ProductModel;

  })(theme.classes.CoreProductModel);

  theme.classes.ProductRecommendations = (function(superClass) {
    extend(ProductRecommendations, superClass);

    function ProductRecommendations() {
      return ProductRecommendations.__super__.constructor.apply(this, arguments);
    }

    return ProductRecommendations;

  })(theme.classes.CoreProductRecommendations);

  theme.classes.ProductVideo = (function(superClass) {
    extend(ProductVideo, superClass);

    function ProductVideo() {
      return ProductVideo.__super__.constructor.apply(this, arguments);
    }

    return ProductVideo;

  })(theme.classes.CoreProductVideo);

  theme.classes.Product = (function(superClass) {
    extend(Product, superClass);

    function Product(root) {
      var _this;
      this.root = root;
      this.copyLink = bind(this.copyLink, this);
      this.pauseOtherMedia = bind(this.pauseOtherMedia, this);
      this.reorderModalImages = bind(this.reorderModalImages, this);
      this.updateVariantMedia = bind(this.updateVariantMedia, this);
      this.swapMedia = bind(this.swapMedia, this);
      this.resizeListeners = bind(this.resizeListeners, this);
      this.balanceColumns = bind(this.balanceColumns, this);
      this.indexContentBlocks = bind(this.indexContentBlocks, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.social_root = el('.product-page--social');
      _this.copy_link = _this.social_root.find('.social-share--item-copy');
      _this.copy_text_wrapper = _this.social_root.find('.social-share--item-copy--wrapper');
      _this.is_product_page = _this.root.hasClass('product-page--root');
      if (_this.is_product_page && _this.copy_text_wrapper.length) {
        _this.copy_text = _this.copy_text_wrapper.text().trim();
      }
      Product.__super__.constructor.apply(this, arguments);
    }

    Product.prototype.load = function() {
      var _this;
      _this = this;
      Product.__super__.load.apply(this, arguments);
      if (_this.is_product_page) {
        _this.pauseOtherMedia();
        _this.indexContentBlocks();
        _this.balanceColumns();
        _this.resizeListeners();
        _this.reorderModalImages();
        return _this.copyLink();
      }
    };

    Product.prototype.indexContentBlocks = function() {
      var _this, content_blocks;
      _this = this;
      content_blocks = _this.root.find('.product-page--content-blocks, .product-page--media-variant');
      return content_blocks.each(function(block, index) {
        return block.setAttribute('data-block-index', index);
      });
    };

    Product.prototype.balanceColumns = function() {
      var _this, content_blocks, double_column_container, left_height, left_side, right_height, right_side, single_column;
      _this = this;
      double_column_container = _this.root.find('.product-page--column-container');
      single_column = _this.root.find('.product-page--single-column');
      content_blocks = _this.root.find('.product-page--content-blocks, .product-page--media-variant');
      left_side = _this.root.find('.product-page--column-left');
      right_side = _this.root.find('.product-page--column-right');
      content_blocks.el = Array.from(content_blocks.el);
      content_blocks.el.sort(function(first_el, second_el) {
        return +first_el.getAttribute('data-block-index') - +second_el.getAttribute('data-block-index');
      });
      single_column.append(content_blocks);
      single_column.removeAttr('style');
      double_column_container.hide();
      if (content_blocks.length > 1 && theme.utils.mqs.current_window !== 'small') {
        single_column.css('width', 'calc(50% - 16px)');
        left_height = 0;
        right_height = 0;
        content_blocks.each(function(block, index) {
          var block_el, block_height;
          block_el = el(block);
          block_height = block_el.height();
          if (left_height <= right_height) {
            left_side.append(block_el);
            return left_height += block_height;
          } else {
            right_side.append(block_el);
            return right_height += block_height;
          }
        });
        single_column.hide();
        return double_column_container.css('display', 'flex');
      }
    };

    Product.prototype.resizeListeners = function() {
      var _this;
      _this = this;
      return theme.window.on('resize.Product', theme.utils.debounce(20, function() {
        return _this.balanceColumns();
      }));
    };

    Product.prototype.swapMedia = function(media_1, media_2) {
      var _this, media_1_clone, media_2_clone;
      _this = this;
      media_1_clone = media_1.clone();
      media_2_clone = media_2.clone();
      media_1.replaceWith(media_2_clone);
      return media_2.replaceWith(media_1_clone);
    };

    Product.prototype.updateVariantMedia = function(variant_media_id) {
      var _this, featured_media, modal_images, new_featured_media, new_first_modal_image, other_media;
      _this = this;
      if (!_this.is_product_page) {
        Product.__super__.updateVariantMedia.apply(this, arguments);
        return;
      }
      featured_media = _this.root.find('.product-page--featured-media .product-media--featured');
      other_media = _this.root.find('.product-media--featured');
      modal_images = _this.root.find('.product-page--modal-image');
      if (variant_media_id && variant_media_id !== featured_media.data('id')) {
        new_featured_media = other_media.filter("[data-id='" + variant_media_id + "']");
        new_first_modal_image = modal_images.filter("[data-id='" + variant_media_id + "']");
        _this.swapMedia(featured_media, new_featured_media);
        _this.swapMedia(modal_images.first(), new_first_modal_image);
        _this.balanceColumns();
        _this.reorderModalImages();
      }
    };

    Product.prototype.reorderModalImages = function() {
      var _this, modal_images, modal_wrapper, product_images;
      _this = this;
      modal_images = _this.root.find('.product-page--modal-image');
      modal_wrapper = _this.root.find('.product-page--modal-wrapper');
      product_images = _this.root.find('.product-media--featured[data-media-type="image"]');
      return product_images.each(function(image) {
        var modal_content, product_id;
        product_id = el(image).attr('data-id');
        modal_content = modal_images.filter("[data-id='" + product_id + "']").closest('.modal--content');
        return modal_wrapper.append(modal_content);
      });
    };

    Product.prototype.pauseOtherMedia = function() {
      var _this, playable_media;
      _this = this;
      playable_media = _this.root.find('.product-media--featured [data-js-class]');
      return playable_media.on('click', function() {
        return playable_media.not(el(this)).trigger('pause-media');
      });
    };

    Product.prototype.copyLink = function() {
      var _this;
      _this = this;
      _this.copy_link.on('click keydown', function(event) {
        if (event.type === 'keydown' && event.key !== 'Enter') {
          return;
        }
        navigator.clipboard.writeText(window.location.href);
        _this.copy_text_wrapper.css('opacity', 0);
        return _this.copy_text_wrapper.attr('data-transition', 'forwards');
      });
      _this.copy_text_wrapper.on('transition:at_end', function() {
        _this.copy_text_wrapper.text(theme.translations.url_copied);
        _this.copy_text_wrapper.css('opacity', 1);
        return setTimeout(function() {
          _this.copy_text_wrapper.css('opacity', 0);
          return _this.copy_text_wrapper.attr('data-transition', 'backwards');
        }, 3000);
      });
      return _this.copy_text_wrapper.on('transition:at_start', function() {
        _this.copy_text_wrapper.text(_this.copy_text);
        return _this.copy_text_wrapper.css('opacity', 1);
      });
    };

    return Product;

  })(theme.classes.CoreProduct);

  theme.classes.Radios = (function(superClass) {
    extend(Radios, superClass);

    function Radios() {
      return Radios.__super__.constructor.apply(this, arguments);
    }

    return Radios;

  })(theme.classes.CoreRadios);

  theme.classes.RecentProducts = (function(superClass) {
    extend(RecentProducts, superClass);

    function RecentProducts() {
      return RecentProducts.__super__.constructor.apply(this, arguments);
    }

    return RecentProducts;

  })(theme.classes.CoreRecentProducts);

  theme.classes.Search = (function(superClass) {
    extend(Search, superClass);

    function Search() {
      return Search.__super__.constructor.apply(this, arguments);
    }

    return Search;

  })(theme.classes.CoreSearch);

  theme.classes.Sections = (function(superClass) {
    extend(Sections, superClass);

    function Sections() {
      return Sections.__super__.constructor.apply(this, arguments);
    }

    return Sections;

  })(theme.classes.CoreSections);

  theme.classes.ServiceList = (function(superClass) {
    extend(ServiceList, superClass);

    function ServiceList() {
      return ServiceList.__super__.constructor.apply(this, arguments);
    }

    return ServiceList;

  })(theme.classes.CoreServiceList);

  theme.classes.XMenu = (function(superClass) {
    extend(XMenu, superClass);

    function XMenu(root) {
      var _this;
      this.root = root;
      this.checkOverlap = bind(this.checkOverlap, this);
      this.alignSubmenus = bind(this.alignSubmenus, this);
      this.load = bind(this.load, this);
      _this = this;
      _this.cart_count = el('.header--cart-count');
      _this.hide_when_overlapping = document.querySelectorAll('.header--root .layout--login, .header--root .popup--open, .header--root .cart-link, .header--root .header--search');
      XMenu.__super__.constructor.apply(this, arguments);
    }

    XMenu.prototype.load = function() {
      var _this;
      _this = this;
      XMenu.__super__.load.apply(this, arguments);
      return _this.alignSubmenus();
    };

    XMenu.prototype.alignSubmenus = function() {
      var _this, logo_offset, sub_menus;
      _this = this;
      logo_offset = document.querySelector('.header--root .logo--root').offsetWidth;
      sub_menus = _this.root.find('[data-x-menu--depth="3"] .x-menu--level-2--container');
      return sub_menus.each(function(sub_menu) {
        sub_menu.style.left = logo_offset + "px";
        return sub_menu.style.width = "calc(100% - " + logo_offset + "px)";
      });
    };

    XMenu.prototype.checkOverlap = function() {
      var _this, header;
      _this = this;
      header = document.querySelector('.header--root');
      _this.cart_count.attr('data-menu-overlap', 'false');
      header.setAttribute('data-menu-overlap', 'false');
      _this.hide_when_overlapping.forEach(function(el) {
        return el.removeAttribute('style');
      });
      XMenu.__super__.checkOverlap.apply(this, arguments);
      if (_this.root.data('x-menu--overlap')) {
        header.setAttribute('data-menu-overlap', 'true');
        _this.hide_when_overlapping.forEach(function(el) {
          return el.style.display = 'none';
        });
        if (parseInt(_this.cart_count.find('.cart--external--total-items').text()) > 0) {
          return _this.cart_count.attr('data-menu-overlap', 'true');
        }
      }
    };

    return XMenu;

  })(theme.classes.CoreXMenu);

  el = function(selector, container) {
    if (container == null) {
      container = document;
    }
    return new theme.classes.CoreDomObject(selector, container);
  };

  new (Main = (function() {
    function Main() {
      this.loadSwipeLibrary = bind(this.loadSwipeLibrary, this);
      this.configureLinks = bind(this.configureLinks, this);
      this.load = bind(this.load, this);
      var _this;
      _this = this;
      theme.body = el('body');
      theme.window = el(window);
      _this.load();
    }

    Main.prototype.load = function() {
      var _this;
      _this = this;
      theme.sections = new theme.classes.Sections();
      theme.utils = new theme.classes.CoreUtils();
      theme.utils.stylesheetLoaded().then(function() {
        theme.utils.loadJsClasses();
        return theme.body.attr('data-assets-loaded', 'true');
      });
      _this.configureLinks();
      _this.loadSwipeLibrary();
      theme.classes.Cart.getItems();
      return theme.window.trigger('theme:loaded');
    };

    Main.prototype.configureLinks = function() {
      return document.querySelectorAll('[data-item="hidden-text"] a').forEach(function(link) {
        return link.setAttribute('tabindex', '-1');
      });
    };

    Main.prototype.loadSwipeLibrary = function() {
      return libraryLoader('swipe', theme.assets.swipe, function() {
        return theme.utils.swipe();
      });
    };

    return Main;

  })());

}).call(this);


