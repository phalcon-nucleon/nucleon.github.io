(function (window, document, $, M) {
  var Loader = {
    show: function () {
      $('.preloader').addClass('active');
    },
    hide: function () {
      $('.preloader').removeClass('active');
    },
    ajax: function () {
      Loader.show();

      return $.ajax.apply($, arguments).always(function () {
        Loader.hide();
      })
    }
  };

  var Sidenav = {
    init: function () {
      var $slide = $('#slide-out');
      $slide.find('.collapsible').collapsible({
        onOpenStart: function (elem) {
          $(elem).find('i').text('keyboard_arrow_down');
        },
        onCloseStart: function (elem) {
          $(elem).find('i').text('keyboard_arrow_right');
        }
      });

      $slide.on('click', 'a[data-template]', function () {
        Sidenav.select($(this))
      })
    },
    select: function ($elem) {
      $('#slide-out').find('li.active > a[data-template]').parent().removeClass('active');
      $elem.parent().addClass('active');
      M.Collapsible.getInstance($elem.parents('.collapsible').get(0)).open($elem.parents('.no-padding').index());
    }
  };

  var Template = {
    __current: null,
    init: function () {
      $(window).on("popstate", function () {
        Template.show(location.hash.match(/^\#\!([^@]+)/)[1]);
      });
    },
    ready: function () {
      if (location.hash.substring(0, 2) === '#!') {
        Template.show(location.hash.match(/^\#\!([^@]+)/)[1]);
      }
    },
    show: function (template) {
      if(Template.__current === template){
        return;
      }

      Template.__current = template;

      Sidenav.select($('a[href="#!' + template + '"]'));

      Loader.ajax({
        url: 'templates/' + template
      }).done(function (data) {
        window.scrollTo(0,0);

        $('[data-template-title]').text(template.replace(/.+\/(.+).html/, '$1').replace(/[_-]/g, ' ').replace(/^(.)|\s+(.)/g, function ($1) {
          return $1.toUpperCase()
        }));
        $('[data-template-container]').html(data);

        $('body').trigger('template.show');
      })
    },
    onShow: function (callback) {
      $('body').on('template.show', callback);
    }
  };

  var HAnchor = {
    init: function () {
      $('body').on('click', '[data-hanchor]', function () {
        var anchor = $(this).data('hanchor');

        location.hash = location.hash.replace(/@.+/, '') + '@' + anchor;

        $('[data-anchor="' + anchor + '"]').scrollTo();
      });

      Template.onShow(function () {
        var match = location.hash.match(/\#\!.+@(.+)/);

        if (match) {
          $('[data-anchor="' + match[1] + '"]').scrollTo();
        }
      })
    }
  };

  var Main = {
    init: function () {
      M.AutoInit();
      Sidenav.init();
      HAnchor.init();

      Template.init();

      Template.onShow(function () {
        $('pre code').each(function (i, block) {
          hljs.highlightBlock(block);
        });
      });
    },
    ready:function () {
      Template.ready();
    }
  };

  $.fn.scrollTo = function () {
    $('html, body').animate({
      scrollTop: $(this).offset().top
    }, 300);
  };

  $(document).ready(Main.init);
  $(window).on('load', Main.ready);
})(window, document, jQuery, M);
