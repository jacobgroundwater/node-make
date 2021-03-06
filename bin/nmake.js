#!/usr/bin/env node

var comm = require('commander')
var buff = require('buffer')
var mu   = require('mu2');
var vm   = require('vm');
var cp   = require('child_process');
var fs   = require('fs');
var path = require('path')

mu.root = __dirname + '/../templates'

function compile(data){
	var templ = [];
	data.split(/\n{2,}/).forEach(function(stanza){
		
		var lines = stanza.split(/\n/)
		var heads = lines.shift().trim().split(':')
		
		var head = heads[0];
		var deps = [];
		
		if(!head) return;
		
		heads[1].trim().split(/\s+/).forEach(function(line){
			if(line=='') return;
			deps.push({item:line});
		})
		
		var tail = lines;
		templ.push({
			head: head,
			deps: deps,
			exec: tail.join('\n')
		})
		
	})
	return templ;
}

function render(code,next){
	var temp = '';
	var rend = mu.compileAndRender(comm.template, {NMAKEFILE: compile(code)})
	rend.on('data', function (data) {
		temp += data;
	})
	rend.on('end', function(){
		next(temp);
	});
	rend.on('error',function(err){
		console.log(err)
	})
}

function evalt(data){
	
	var coffee = __dirname + '/../node_modules/.bin/coffee'
	var cf = cp.spawn(coffee,['-s'],{
		stdio : ['pipe',process.stdout,process.stderr]
	});
	cf.stdin.write(data)
	cf.stdin.destroy()
	cf.on('exit',function(code){
		
	})
	
}

function make(file){
	if(fs.existsSync(file)){
		render(fs.readFileSync(file).toString(),function(data){
			if(comm.compile){
				console.log(data);
			}else{
				evalt(data);
			}
		})
	}else{
		console.log('No NMakefile Found')
	}
}

comm.version('0.0.0')
comm.option('-c, --compile'          ,'compile to coffee script but do not execute')
comm.option('-f, --nmakefile <FILE>' ,'use FILE as NMakefile','NMakefile')
comm.option('-t, --template <NAME>'  ,'use the template type NAME', 'node.coffee')

comm.parse(process.argv)

make(comm.nmakefile)


