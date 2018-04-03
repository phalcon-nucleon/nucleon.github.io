(function (window, document, $, M) {
  var Main = {
    init: function () {
      M.AutoInit()

      $('body').on('click', '[data-template]', function () {
        var $this = $(this);
        var template = $this.data('template');

        Main.loader('show');

        $.ajax({
          url: 'templates/' + template + '.html'
        }).done(function (data) {
          $('[data-template-target]').html(data);
          Main.loader('hide');
        })
      })
    },
    loader: function (way) {
      switch (way) {
        case 'show':
          $('.preloader').addClass('active');
          break;
        case 'hide':
          $('.preloader').removeClass('active');
          break;
      }
    }
  };

  $(document).ready(Main.init);
})(window, document, jQuery, M);