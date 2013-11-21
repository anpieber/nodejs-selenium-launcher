var fs = require('fs')
    , path = require('path')
    , request = require('request')
    , hashFile = require('hash_file')
    , Zip = require('adm-zip')

var platform
    , arch = '32'
    , version = '2.6'

switch(process.platform){
    case 'darwin':
        platform = 'mac'
        break
    case 'win32':
        platform = 'win'
        break
    case 'linux':
        platform = 'linux'
        arch = process.arch === 'x64' ? '64' : '32'
        break
    default:
        platform = false
        break
}

var expectedSha = {
    'linux32': '007bbff965cb4be6fe7734236b5afd52',
    'linux64': '0dbc5606c8481f8ae9775d1a27c3a8a5',
    'mac32': '648f6fad997ff0bc9e177cf2ad3963f4',
    'win32': '48f8d2462e44b8d06f88ff56857620c0'
}

var filename = 'chromedriver_'+ platform + arch +'.zip'
    , url = 'http://chromedriver.storage.googleapis.com/'+version+"/"+filename
    , outfile = path.join(path.dirname(__filename), '..', 'tmp', filename)
    , driver = path.join(path.dirname(__filename), '..', 'tmp', 'chromedriver')

module.exports = function(options, cb){
    if( !cb && typeof options === 'function' ){
        cb = options
        options = {}
    }

    if( !options.chrome ){
        return cb()
    }

    if( !platform ){
        return cb('No Chromedriver support for platform: '+ process.platform)
    }

    function download() {
        console.log('Downloading Chromedriver '+ version)
        var i = 0
        request({ url: url })
            .on('end', function() {
                process.stdout.write('\n')
                extractFile();
            })
            .on('data', function() {
                if (i == 8000) {
                    process.stdout.write('\n')
                    i = 0
                }
                if (i % 100 === 0) process.stdout.write('.')
                i++
            })
            .pipe(fs.createWriteStream(outfile))
    }

    var retry = 5;

    function extractFile(){
        try {
            var zip = new Zip(outfile)
            zip.extractAllTo(path.join(path.dirname(__filename), '..', 'tmp'))
            fs.chmod(driver, '0111', function(err){
                if(err) return cb(err)
                cb(null, driver)
            })
        } catch(err) {
            if( --retry ){
                setTimeout(extractFile, 100);
            } else {
                fs.unlink(outfile, function(){
                    throw new Error(err);
                })
            }
        }
    }

    fs.stat(outfile, function(er, stat) {
        if (er) return download()
        hashFile(outfile, 'md5', function(er, actualSha) {
            if (er) return cb(er)
            if (actualSha != expectedSha[platform + arch]) return download()
            cb(null, driver)
        })
    })

};
