describe("sanity", function(){

    var assert = require('assert');
    var seleniumLauncher = require('../lib/selenium-launcher');
    var wd = require('wd');

    describe("launch", function () {

        var browser, seleniumRef;

        function launchSelenium(seleniumOptions, onSeleniumLaunched) {
            var args = [];

            if (typeof seleniumOptions == "function") {
                onSeleniumLaunched = seleniumOptions;
            } else {
                args.push(seleniumOptions);
            }

            function _onSeleniumLaunched(err, selenium) {
                if (err) {
                    selenium.kill();
                    done(err);
                }
                seleniumRef = selenium;
                browser = wd.promiseChainRemote(selenium.host, selenium.port);
                onSeleniumLaunched();
            }

            args.push(_onSeleniumLaunched);

            seleniumLauncher.apply(null, args);
        }

        afterEach(function (done) {
            browser.quit(function () {
                seleniumRef.kill();
                done();
            });
        });

        it("should visit google with firefox", function(done){
            launchSelenium(function () {
                browser
                    .init({browserName: "firefox"}, function (err) {
                        if (err) throw err;
                    })
                    .get("https://google.de")
                    .then(function () {
                        return browser.title();
                    })
                    .then(function (title) {
                        assert.equal(title, "Google");
                    })
                    .nodeify(done);
            });
        });

        it("should download chromedriver and visit google with chrome", function(done){
            launchSelenium({ chrome: true }, function () {
                browser
                    .init({browserName: "chrome"}, function (err) {
                        if (err) throw err;
                    })
                    .get("https://google.de")
                    .then(function () {
                        return browser.title();
                    })
                    .then(function (title) {
                        assert.equal(title, "Google");
                    })
                    .nodeify(done);
            })
        });
    });

    describe('environment', function () {
        it('should get the server port from the node environment', function(done) {
            process.env.SELENIUM_LAUNCHER_PORT = '4444'
            seleniumLauncher(function(er, selenium) {
                delete process.env.SELENIUM_LAUNCHER_PORT
                if (er) return done(er);
                assert.equal(selenium.port, 4444);
                selenium.on('exit', function() { done() })
                selenium.kill()
            })
        });
    });

});
