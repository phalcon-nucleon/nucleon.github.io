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
      $('#slide-out')
          .on('click', 'a.collapsible-header', function () {
            $('#slide-out').find('li.active > a.collapsible-header').find('i').text('keyboard_arrow_right');
            $(this).find('i').text('keyboard_arrow_down');
          })
          .on('click', 'a[data-template]', function () {
            $('#slide-out').find('li.active > a[data-template]').parent().removeClass('active');
            $(this).parent().addClass('active');
          })
    }
  };

  var Template = {
    init: function () {
      $('body').on('click', '[data-template]', function () {
        Template.show($(this).data('template'))
      })
    },
    show: function (template) {
      Loader.ajax({
        url: 'templates/' + template + '.html'
      }).done(function (data) {
        $('[data-template-title]').text(template.replace(/.+\/(.+)/, '$1').replace(/[_-]/g, ' ').replace(/^(.)|\s+(.)/g, function ($1) {
          return $1.toUpperCase()
        }));
        $('[data-template-target]').html(data);
      })
    }
  };

  var Main = {
    init: function () {
      M.AutoInit();
      Template.init();
      Sidenav.init();
    }
  };

  $(document).ready(Main.init);
})(window, document, jQuery, M);