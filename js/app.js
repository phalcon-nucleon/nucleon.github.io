(function (window, document, $, M) {
  function slug(str){
    return str.toLowerCase().replace(/[^a-zA-Z\d]/g, '-').replace(/-+/g, '-');
  }

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
    current: null,
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
      if (Template.current === template) {
        return;
      }

      Template.current = template;

      Sidenav.select($('a[href="#!' + template + '"]'));

      Loader.ajax({
        url: 'templates/' + template
      }).done(function (data) {

        function split(splitters, str) {
          for (var p, i = 0, l = splitters.length; i < l; i++) {
            p = str.split(splitters[i]);
            if (p.length > 1) {
              return p;
            }
          }

          return [str];
        }

        data = data.replace(/<code>\\?(Phalcon\\.+)<\/code>/gm, function (g, match) {

          var c = split(['::', '-&gt;', '->'], match);

          return '<a target="_blank" href="https://docs.phalconphp.com/en/3.3/api/' + c[0].replace(/^\\/, '').replace(/\\/g, '_') + '"><code>' + match + '</code></a>';
        });

        window.scrollTo(0, 0);

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
      Template.onShow(HAnchor.scrollTo);
      $(window).on("popstate", HAnchor.scrollTo);
    },
    scrollTo: function () {
      var match = location.hash.match(/\#\!.+@(.+)/);

      if (match) {
        $('[data-anchor="' + match[1] + '"]').scrollTo();
      }
    }
  };

  var Summary = {
    init: function () {
      Template.onShow(Summary.generate)
    },
    generate: function () {
      if (!$('.summary.generate').length) {
        return;
      }

      var o = [], h2, h3, base_url = '/' + location.hash.match(/^(\#\![^@]+)/)[1] + '@';

      $('h2, h3, h4').each(function () {
        switch (this.tagName) {
          case 'H2':
            o.push(h2 = {
              name: this.innerHTML,
              slug: slug(this.innerText),
              items: []
            });
            h3 = null;
            break;
          case 'H3':
            h2.items.push(h3 = {
              name: this.innerHTML,
              slug: slug(this.innerText),
              items: []
            });
            break;
          case 'H4':
            (h3 || h2).items.push({
              name: this.innerHTML,
              slug: slug(this.innerText),
              items: []
            });
            break;
        }

        $(this).attr('data-anchor', slug(this.innerText))
      });

      function _gen_li(o) {
        var li = '<li><a href="' + base_url + o.slug + '">' + o.name + '</a>';

        if (o.items.length) {
          li += '<ul>';
          for (var i = 0, l = o.items.length; i < l; i++) {
            li += _gen_li(o.items[i]);
          }
          li += '</ul>';
        }

        return li + '</li>'
      }

      var lis = '';

      for (var i = 0, l = o.length; i < l; i++) {
        lis += _gen_li(o[i]);
      }

      $('.summary.generate').html(lis);
    }
  };

  var Main = {
    init: function () {
      M.AutoInit();
      Summary.init();
      Sidenav.init();
      HAnchor.init();

      Template.init();

      Template.onShow(function () {
        Prism.highlightAll()
      });
      Template.onShow(function () {
        var $elem = $('#slide-out').find('li.active > a[data-template]');
        document.title = $elem.parents('.no-padding').find('> a > span:first').text() + ': ' + $elem.text() + ' - Nucleon - PHP Framework build with Phalcon';
      })
    },
    ready: function () {
      Template.ready();
    }
  };

  $.fn.scrollTo = function () {
    if ($(this).length) {
      $('html, body').animate({
        scrollTop: $(this).offset().top
      }, 300);
    }
  };

  Main.init();
  Main.ready();

  if (window.navigator.userAgent.indexOf("MSIE ")) {
    (function () {
      var hash = location.hash;
      $('body').on('click', function () {
        setTimeout(function () {
          if (hash !== location.hash) {
            hash = location.hash;
            $(window).trigger('popstate');
          }
        })
      })
    })()
  }

})(window, document, jQuery, M);
