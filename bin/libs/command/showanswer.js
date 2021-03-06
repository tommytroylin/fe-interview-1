'use strict';

var promiseify = require('just-promiseify');
var inquirer = require('inquirer');
var fs = require('fs');
var path = require('path');
var TaskRunner = require('terminal-task-runner');
var utils = require('../Utils');

var answer = function(options) {
    return promiseify(fs.readdir)(options.taskDir)
        .then(function(dirs) {
            return dirs;
        })
        .then(function(questions) {
            return Promise.all([
                questions,
                promiseify(fs.readdir)(process.cwd())
            ]);
        })
        .then(function(data) {
            return promiseify(inquirer.prompt)([
                {
                    type: 'list',
                    name: 'question',
                    message: '选择要查阅答案的题目',
                    default: 0,
                    choices: data[1].filter(function(file) {
                        try {
                            return fs.statSync(path.resolve(process.cwd(), file)).isDirectory();
                        } catch (e) {
                            return false;
                        }
                    })
                        .filter(function(file) {
                            return data[0].find(function(raw) {
                                return raw.indexOf(file) > 0;
                            });
                        })
                        .map(function(file) {
                            return {
                                name: file,
                                value: data[0].find(function(raw) {
                                    return raw.indexOf(file) > 0;
                                })
                            };
                        })
                }
            ]);
        })
        .then(function(answer) {
            if (answer.question.substring(3) === 'inherit') {
                return require(path.resolve(options.taskDir, answer.question, 'CopyAnwser.js'))(answer.question.substring(3));
            }
            if (!utils.fileExist(path.resolve(process.cwd(), answer.question.substring(3), 'answer.js'))) {
                utils.copyFile(path.resolve(options.taskDir, answer.question, 'answer.js'), path.resolve(process.cwd(), answer.question.substring(3), 'answer.js'));
            }
            TaskRunner.logger.info('答案已放置在"./' + answer.question.substring(3) + '/answer.js"，用个人偏好的IDE查看即可');
        });
};

module.exports = answer;
