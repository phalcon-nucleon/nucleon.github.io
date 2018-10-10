(function (window, document, $, M) {
  var PHALCON_DOCS_VERSION = "3.4";

  function phdocs(path) {
    return "https://docs.phalconphp.com/en/" + PHALCON_DOCS_VERSION + path;
  }

  $.fn.scrollTo = function () {
    if ($(this).length) {
      $('html, body').animate({
        scrollTop: $(this).offset().top
      }, 300);
    }
  };

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

  function isXLarge() {
    return window.innerWidth > 1200;
  }

  function isLarge() {
    return window.innerWidth > 992 && window.innerWidth <= 1200;
  }

  function isMedium() {
    return window.innerWidth > 600 && window.innerWidth <= 992;
  }

  function isSmall() {
    return window.innerWidth <= 600
  }

  function slug(str) {
    return str.toLowerCase().replace(/[^a-zA-Z\d]/g, '-').replace(/-+/g, '-');
  }

  var hasOwn = Object.prototype.hasOwnProperty;

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
      var $slide = $('#slide-out');
      $slide.find('li.active > a[data-template]').parent().removeClass('active');
      $elem.parent().addClass('active');
      M.Collapsible.getInstance($elem.parents('.collapsible').get(0)).open($elem.parents('.no-padding').index());
      if (isSmall() || isMedium()) {
        var inst = M.Sidenav.getInstance($slide[0]);
        inst.isOpen = true;
        inst.close();
      }
    }
  };

  var Template = {
    current: null,
    version: null,
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

      Sidenav.select($('a[href="#!' + template + '"][data-template]'));

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

          return '<a target="_blank" href="' + phdocs('/api/' + c[0].replace(/^\\/, '').replace(/\\/g, '_')) + '"><code>' + match + '</code></a>';
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

  var Search = {
    init: function () {
      var index = lunr(function () {
        this.k1(1.4);
        this.b(0.5);

        this.field('title', {boost: 10});
        this.field('body');
        this.ref('href');

        for (var ref in documents) {
          if (hasOwn.call(documents, ref)) {
            this.add({
              href: ref,
              title: ref.replace('[\w-]+.([\w-]+).html'),
              body: documents[ref]
            })
          }
        }
      });

      $('#search').on('keyup focus', function (ev) {
        switch (ev.keyCode) {
          case 37:
          case 39:
            return;
          case 38:
            return Search.kup();
          case 40:
            return Search.kdown();
          case 13:
            var $sel = $('.search-results a.hover');
            if ($sel.length) {
              return Search.select($sel);
            } else {
              $sel = $('.search-results a:first-child');
              if ($sel.length) {
                return Search.select($sel);
              }
            }
        }

        var value = $(this).val();
        if (value.length < 2) {
          if (value.length === 0) {
            Search.empty();
          }
          return;
        }

        var values = value.replace(/ +/g, ' ').split(' ');

        value = values.join(' ') + ' ' + values.join('* ') + '*';

        Search.render(index.search(value).slice(0, 6));
      });

      $('.search').on('click', 'a', function () {
        Search.select();
      });

      $('body').on('click', function (ev) {
        var $target = $(ev.target);
        if (!($target.is('.search') || $target.parents('.search').length)) {
          Search.empty();
        }
      });

      $('.search-results').on('mouseenter', 'a', function () {
        $('.search-results a.hover').removeClass('hover');
        $(this).addClass('hover')
      })
    },
    render: function (founds) {
      var $found = $('.search-results').empty();
      for (var ref, i = 0, l = founds.length; i < l; i++) {
        ref = founds[i].ref;
        $found.append($('<a href="' + ref + '">' + ref.replace(/.+\/([\w-]+.html)/, '$1') + '</a>'))
      }
    },
    kup: function () {
      var $a = $('.search-results a'),
        $sel = $a.filter('.hover');

      if ($sel.length) {
        if ($sel.prev().length) {
          $sel.prev().addClass('hover');
        } else {
          $a.last().addClass('hover');
        }
        $sel.removeClass('hover')
      } else {
        $a.last().addClass('hover');
      }
    },
    kdown: function () {
      var $a = $('.search-results a'),
        $sel = $a.filter('.hover');

      if ($sel.length) {
        if ($sel.next().length) {
          $sel.next().addClass('hover');
        } else {
          $a.first().addClass('hover');
        }
        $sel.removeClass('hover')
      } else {
        $a.first().addClass('hover');
      }
    },
    select: function ($sel) {
      if ($sel) {
        location.hash = $sel.attr('href');
      }

      $("#search").val('');
      Search.empty();
    },
    empty: function () {
      $('.search-results').empty();
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
        var $elem = $('#slide-out').find('li.active > a[data-template]');
        document.title = $elem.parents('.no-padding').find('> a > span:first').text() + ': ' + $elem.text() + ' - Nucleon - PHP Framework build with Phalcon';
      });

      Template.onShow(function () {
        $('[data-phalcon-link]').each(function () {
          var $this = $(this);

          $this.attr('href', phdocs($this.data('phalcon-link')));
          $this.attr('target', '_blank')
        })
      });

      Template.onShow(Prism.highlightAll);

      Template.ready();
    },
    ready: function () {
      Search.init();
    }
  };

  Main.init();

  $(document).ready(Main.ready);

})(window, document, jQuery, M, lunr);
