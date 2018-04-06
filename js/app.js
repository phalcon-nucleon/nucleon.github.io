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
    init: function () {
      $('body').on('click', '[data-template]', function () {
        Template.show($(this).attr('href').substr(2))
      })
    },
    show: function (template) {
      Sidenav.select($('a[href="#!' + template + '"]'));

      Loader.ajax({
        url: 'templates/' + template
      }).done(function (data) {
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

        $('[data-anchor="' + anchor + '"]').scrollTo();
      })
    }
  };

  var Main = {
    init: function () {
      M.AutoInit();
      Template.init();
      Sidenav.init();
      HAnchor.init();

      Template.onShow(function () {
        $('pre code').each(function (i, block) {
          hljs.highlightBlock(block);
        });
      });

      if (location.hash.substring(0, 2) === '#!') {
        Template.show(location.hash.substring(2));
      }
    }
  };

  $.fn.scrollTo = function () {
    $('html, body').animate({
      scrollTop: $(this).offset().top
    }, 300);
  };

  $(document).ready(Main.init);
})(window, document, jQuery, M);
