const gm = require('gm');
const fs = require('fs');
const _ = require('lodash');
const async = require('async');
const rimraf = require('rimraf');
let source = fs.readdirSync('./source');

//这里应该是用forEach的,但是这儿需要记住索引,所以还是用for循环
exports.arrange = (width, height, cb) => {
    //先清空`destination`目录
    rimraf('./destination/*', function () {
        let groups = _.chunk(source, width);  //width是宽度, groups.length是实际的高度

        let formatGroups = groups.slice(0, height);

        async.eachOfLimit(formatGroups, 2, (group, index, cbGroup) => {
            var gmstate = gm('./source/' + group[0]);
            for (let j = 1; j < group.length; j++) {
                gmstate.append('./source/' + group[j], true);
            }
            gmstate.write('./destination/' + (index + 10000) + ".jpg", function (err) {
                if (err) {
                    console.dir(arguments);
                    return cb(err);
                }
                console.log(this.outname + " created  ::  " + arguments[3])
                return cbGroup();
            });
        }, (err) => {
            let integrations = fs.readdirSync('./destination');
            let gmstateDes = gm('./destination/' + integrations[0]);
            for (let i = 1; i < integrations.length; i++) {
                gmstateDes.append('./destination/' + integrations[i]);
            }
            gmstateDes.write('./destination/' + "theLastOne.jpg", function (err) {
                if (err) {
                    console.dir(arguments);
                    return cb(err);
                }
                console.log(this.outname + " created  ::  " + arguments[3]);
                return cb(null, 'finish');
            });
        });
    });
}


