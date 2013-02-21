/*
Copyright (C) 2012 by WebCreative5 - Samuel Ronce

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


// Erik M�ller
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
// --

Class.create("ModelClientClass", {
	create: function(name, events, model) {
		if (!(events instanceof Array)) {
			model = events;
			events = false;
		}
		model.events = events;
		Class.create(name, model);
	},
	"new": function(name) {
		var _class = Class["new"](name).extend({
			_methods: {},
			emit: function(name, data, callback) {
				
				if (!data) {
					data = [];
				}
				if (typeof data == "function") {
					callback = data;
				}
				if (callback) {
					this.on(name, callback);
				}
				
				if (this[name]) {
					if (!(data instanceof Array)) {
						var new_a = [];
						for (var key in data) {
							new_a.push(data[key]);
						}
						data = new_a;
					}
					var ret = this[name].apply(this, data);
					this.call(name, ret);
					
				}
				
			},
			on: function(name, callback) {
				if (!this._methods[name]) {
					this._methods[name] = {};
				}
				this._methods[name].callback = callback;
			},
			call: function(name, data) {
				if (this._methods[name]) this._methods[name].callback(data);
			}
		});
		if (this.events) {
			for (var key in this.events) {
				obj = _class[events[key]];
				if (obj) {
					obj.on(this.events[key], function(data) {
						if (!data) {
							data = {};
						}
						obj.call(_class, data);
					});
				}
			}
		}
		return _class;
	}
});

var Model = Class["new"]("ModelClientClass"),
	Global_CE;

/**
	@class CanvasEngine
	@static
	@details
		
	See "defines" method
			
*/
 /**
@method CanvasEngine.defines Initialize CanvasEngine  by setting the canvas 
@param {String} canvas canvas ID
@param {Object} params (optional) additional parameters

* swf_sound : view Sound class
* cocoonjs : Object indicating the size of the canvas. Use this property if you want to compile your project with CocoonJS (http://ludei.com)

Example : 
		{width: 640, height: 480}
@return CanvasEngineClass
@example
"CE"  is equivalent to "CanvasEngine"

	var canvas = CE.defines("canvas_id").
				 ready(function() {
					// DOM is ready
				 });
 */
CanvasEngine.defines = function(canvas, params) {
	params = params || {};
	if (params.render === undefined) params.render = true;
	if (typeof canvas == "string") {
		canvas = [canvas];
	}
	var CanvasEngine;
/**
@doc engine
@class CanvasEngineClass Main class to use Canvas Engine
		
	var canvas = CE.defines("canvas_id"); // CanvasEngine object

	canvas.ready(function(ctx) {
		canvas.Scene.call("MyScene");
	});
		
*/
	Class.create("CanvasEngineClass", {
		_noConflict: false, 
		initialize: function(element) {
			this.canvas = canvas;
			this.el_canvas = [];
		},
/**
@doc engine/
@method ready Calls the function when DOM is ready. The method uses "window.load" or SoundManager callback if it is present
@param {Function} callback
@return CanvasEngineClass
@example

	var canvas = CE.defines("canvas_id").
				 ready(function() {
					// DOM is ready
				 });
*/
		ready: function(callback) {
			var self = this;
			CanvasEngine.Sound._manager = typeof(soundManager) !== "undefined";
			if (CanvasEngine.Sound._manager) {
				soundManager.setup({
					  url: params.swf_sound ? params.swf_sound : "swf/",
					  onready: onReady  
				});
			}
			else {
				window.onload = onReady;
			}
			
			function onReady() {	
				for (var i=0 ; i < self.canvas.length ; i++) {
					self.el_canvas.push(self.Canvas["new"](self.canvas[i]));
				}
				if (params.render) CanvasEngine.Scene._loop(self.el_canvas);
				callback();	
			}
			return this;
		},
		plugins: function() {
		
		},
		mouseover: false,
		noConflict: function() {
			this._noConflict = true;
		},
		
/**
@doc materials
@class Materials Resource management game. The class is used with the properties "materials" in the scene but you can still use it for loading external resources to the scene
@example
Using Sound :

	var canvas = CE.defines("canvas_id").
		ready(function() {
			canvas.Scene.call("MyScene");
		});
				
	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {
			canvas.Materials.load("images", [
				{img1: "path/to/img1.png"},
				{img2: "path/to/im2.png"}
			], function(img) {
				console.log("Image is loaded");
			}, function() {
				console.log("All images are loaded");
			});
		}
	});
*/
		Materials: {
			images: {},
			_buffer: {},
			_cache_canvas: {},
			sounds: {},
			fonts: {},
/**
@doc materials/
@method get Get the picture or sound according to its identifier
@param {String} id
@param {String} type (optional) If two identical identifier is several types, specify the type: "image" or "sound"
@return {HTML5Audio|Image}
*/
			get: function(id, type) {
			
				if (type) {
					return this[type + "s"][id];
				}	
			
				if (this.images[id]) {
					return this.images[id];
				}
				else if (this.sounds[id]) {
					return this.sounds[id];
				}
				else if (id instanceof Image || id instanceof HTMLCanvasElement) {
					return id;
				}
				throw "Cannot to draw the image or sound \"" + id + "\" because it does not exist";
			},
			
/**
@doc materials/
@method imageToCanvas Converts an image (Image) in Canvas. The returned object is :
	{
		canvas: {HTML5CanvasElement},
		ctx: {Context2d}
	}
@param {String} id Image id
@param {Boolean} cache Image id
@return {Object}
*/
			imageToCanvas: function(id, cache) {
				if (this._cache_canvas[id] && cache) {
					return this._cache_canvas[id];
				} 
				var img = this.get(id), canvas, ctx;
				
				canvas =  document.createElement('canvas');		
				canvas.width = img.width;
				canvas.height = img.height;
				ctx = canvas.getContext('2d');
				
				ctx.drawImage(img, 0, 0);

				this._cache_canvas[id] = {
					canvas: canvas,
					ctx: ctx
				};
				
				return this._cache_canvas[id];
			},
			
			// obsolete
			createBuffer: function(id, color) {
				
				if (this._buffer[color]) {
					return this._buffer[color];
				}
				canvas =  this.get(id) ;
				this._buffer[color] = canvas;
				return canvas;
				
				var _canvas = this.imageToCanvas(id),
					canvas = _canvas.canvas,
					ctx = _canvas.ctx;
				canvas.id = color;
				ctx.globalCompositeOperation = 'source-atop';
				ctx.fillStyle = "#" + color;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				this._buffer[color] = canvas;

				return canvas;
			},
			
/**
@doc materials/
@method transparentColor Make a color transparent in the image
@param {String} id Image id
@param {String} color hexadecimal code
@param {Boolean} cache (optional) Puts the canvas generated in cache (false by default)
@return {HTML5Canvas}
*/
			transparentColor: function(id, color, cache) {
				var imageData, data, rgb, 
					_canvas = this.imageToCanvas(id, cache),
					canvas = _canvas.canvas,
					ctx = _canvas.ctx;

				imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				data = imageData.data;
				rgb = _CanvasEngine.hexaToRGB(color);
				for(var i = 0, n = data.length; i < n; i += 4) {
					var red = data[i];
				    var green = data[i + 1];
				    var blue = data[i + 2];
					if (red == rgb[0] && green == rgb[1] && blue == rgb[2]) {
						data[i + 3] = 0;
					}
				}
				ctx.putImageData(imageData, 0, 0);
				return canvas;
			},
	
/**
@doc materials/
// @method invertColor Inverts the colors of the image
@param {String} id Image id
@param {Boolean} cache (optional) Puts the canvas generated in cache (false by default)
@return {HTML5Canvas}
*/	
			invertColor: function(id, cache) {
				var imageData, data, 
					_canvas = this.imageToCanvas(id),
					canvas = _canvas.canvas,
					ctx = _canvas.ctx;
					
				data = imageData.data;

				for(var i = 0; i < data.length; i += 4) {
				  data[i] = 255 - data[i];
				  data[i + 1] = 255 - data[i + 1];
				  data[i + 2] = 255 - data[i + 2];
				}
				
				ctx.putImageData(imageData, 0, 0);
				return canvas;
			},
			
/**
@doc materials/
@method cropImage Can crop an image to use independently. Useful for creating patterns in HTML5
@param {String} id Image id
@param {Integer} x Position X
@param {Integer} y Position Y
@param {Integer} w Width
@param {Integer} h height
@return {HTML5Canvas}
*/
			cropImage: function(id, x, y, w, h) {
				var imageData, data, rgb, 
					_canvas = this.imageToCanvas(id),
					canvas = _canvas.canvas,
					ctx = _canvas.ctx
				imageData = ctx.getImageData(x, y, w, h);
				canvas.width = w;
				canvas.height = h;
				ctx.putImageData(imageData, 0, 0);
				return canvas;
			},
			
			// TODO
			// Nearest-neighbor
			
/**
@doc materials/
@method getExtension Gets the file extension
@param {String} filename File name
@return {String}
*/
			getExtension: function(filename) {
				return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
			},
			
/**
@doc materials/
@method load Load a resource
@param {String} type Type : "images" or "sounds"
@param {Array|Object} path Paths to resources.
* If array : Elements are composed of objects where the key is the identifier and value is the path
	
		[
			{img1: "path/to/img1.png"},
			{img2: "path/to/im2.png"}
		]
	
* If object, the key is the identifier and value is the path :
	
	{img1: "path/to/img1.png", img2: "path/to/im2.png"}
	
The value can be an object to give several parameters :
	
	{img1: {path: "path/to/img1.png", transparentcolor: "#ff0000"}, img2: "path/to/im2.png"}
	
"path" is the path and "transparentcolor" the color that will be transparent image
*/
			load: function(type, path, onLoad, onFinish) {
				var i=0, p, self = this, materials = [], img_data;
				
				if (!(path instanceof Array)) {
					path = [path]
				}
				
				for (var j=0 ; j < path.length ; j++) {
					p = path[j];
					for (var key in p) {
						img_data = {};
						if (typeof p[key] == "string") {
							img_data.path = p[key];
						}
						else {
							img_data.path = p[key].path;
							img_data.transparentcolor = p[key].transparentcolor;
						}
						materials.push({
							id: key,
							path: img_data.path,
							transparentcolor: img_data.transparentcolor
						});
						
					}
				}
				
				switch (type) {
					case "images":
						load();
					break;
					case "sounds":
						loadSounds();
					break;
					case "fonts":
						loadFont();
					break;
				}
				
				function load() {
					var img;
					if (materials[i]) {
						img = new Image();
						img.onload = function() {
							var _img;
							if (materials[i].transparentcolor) {
								_img = self.transparentColor(img, materials[i].transparentcolor);
							}
							else {
								_img = img;
							}
							self.images[materials[i].id] = _img;
							i++;
							if(onLoad) onLoad.call(self, _img);
							load();
						};
						img.src = materials[i].path;
					}
					else {
						if (onFinish) onFinish.call(self);
					}
				}
				
				function loadSounds() {
					var img;
					
					function next() {
						i++;
						if (onLoad) onLoad.call(self, this);
						loadSounds();
					}
					
					if (materials[i]) {
						if (CanvasEngine.Sound._manager) {
							self.sounds[materials[i].id] = soundManager.createSound({
							  id: materials[i].id,
							  url:  materials[i].path,
							  autoLoad: true,
							  autoPlay: false,
							  onload: next
							});
						}
						else {
							var snd = new Audio(), 
								_p = materials[i].path,
								ext = self.getExtension(_p);
								
							if (ext == "mp3" && !snd.canPlayType('audio/mpeg')) {
								next();
							}
							else {
								snd.addEventListener('canplaythrough', function() { 
									self.sounds[materials[i].id] = this;
									next();
								}, false);
								snd.addEventListener('error', function (e) { 
									throw e;
								}, false);
								snd.load();
								snd.pause();
							}
							
							snd.src = _p;
						}
					}
					else {
						if (onFinish) onFinish.call(self);
					}
				}
				
				function loadFont() {
					if (materials[i]) {
						var s = document.createElement('style'), 
						rule = "font-family: '" + materials[i].id + "'; src: url('" + materials[i].path + "');";
						s.type = "text/css";
						s.cssText = "@font-face {" + rule + "}";
						document.getElementsByTagName('head')[0].appendChild(s);
						i++;
						if (onLoad) onLoad.call(self, this);
						loadFont();
					}
					else {
						if (onFinish) onFinish.call(self);
					}
				}
			}
		},
		
/**
@doc sound
@class Sound Sound management
The class uses HTML5 audio but you can use SoundManager 2 (http://www.schillmania.com/projects/soundmanager2/). 

Use :
* Insert the JS script : <script src="soundmanager2.js"></script> (http://www.schillmania.com/projects/soundmanager2/doc/getstarted/#basic-inclusion)
* Put the swf file to the root of your project. If you want to change the path :

	var canvas = CE.defines("canvas_id", {
		swf_sound: 'path/to/swf/'
	}).ready(function() {

	});

Assign the path with the property "swf_sound"
@example
Using Sound :
	
	var canvas = CE.defines("canvas_id").
		ready(function() {
			canvas.Scene.call("MyScene");
		});
				
	canvas.Scene.new({
		name: "MyScene",
		materials: {
			sounds: {
				sound_id: "path/to/music.mp3"
			}
		},
		ready: function(stage) {
			canvas.Sound.get("sound_id").play();
		}
	});
	
*/
		Sound: {
			_fade: {},
			_manager: false,
/**
@doc sound/
@method get Get the sound. Use API HTML5 Audio or SoundManager (http://www.schillmania.com/projects/soundmanager2/doc/#smsoundmethods)
@param {String} id Identiant of sound in the preloading
@return {SMSound or HTMLAudioElement}
*/
			get: function(id) {
				var snd = CanvasEngine.Materials.get(id, "sound");
				return snd;
			},
/**
@doc sound/
@method allStop  Stop all music
@param {String} sound_id (optional) Except this music (ID)
@return  {CanvasEngine.Sound}
*/
			allStop: function(sound) {
				sound = sound || "";
				var sounds = CanvasEngine.Materials.sounds;
				for (var key in sounds) {
					if (key != sound) {
						sounds[key].stop();
					}
				}
				return this;
			},
/**
@doc sound/
@method playOnly Only play a sound (and other stops)
@param {Integer} id Identifier of the music
@return  {CanvasEngine.Sound}
*/
			playOnly: function(id) {
				this.allStop(id);
				this.get(id).play();
				return this;
			},
/**
@doc sound/
@method fadeIn  To fade for unmute
@param {String} id Identiant of sound in the preloading
@param {Integer} duration frames
@param {Function} callback (optional) Callback function when the fade is complete
*/
			fadeIn: function(id, time, callback) {
				this.fadeTo(id, time, 1, callback);
			},
/**
@doc sound/
@method fadeOut To fade for mute
@param {String} id Identiant of sound in the preloading
@param {Integer} duration frames
@param {Function} callback (optional) Callback function when the fade is complete
*/
			fadeOut: function(id, time, callback) {
				this.fadeTo(id, time, 0, callback);
			},
/**
@doc sound/
@method fadeTo  Fade to a final value
@param {String} id Identiant of sound in the preloading
@param {Integer} duration frames
@param {Integer} to End value between 0 and 1
@param {Function} callback (optional) Callback function when the fade is complete
*/
			fadeTo: function(id, time, to, callback) {
				var sound = this.get(id), 
					volume = this._manager ? sound.volume / 100 : sound.volume;
				this._fade[id] = {
					sound: sound,
					init: volume,
					c_volume: volume,
					f_time: time,
					to: to,
					callback: callback
				};
			},
			_loop: function() {
				var s, finish;
				for (var key in this._fade) {
					s = this._fade[key];
					finish = false;
					if (s) {
						if (s.init < s.to) {
							if (s.c_volume >= s.to) {
								s.c_volume = s.to;
								finish = true;
							}
							else {
								s.c_volume += (Math.abs(s.to - s.init) / s.f_time);
							}
							// Hack to INDEX_SIZE_ERR: DOM Exception 1 
							if (s.c_volume > .999) {
								s.c_volume = 1;
							}
						}
						else {
							if (s.c_volume <= s.to) {
								s.c_volume = s.to;
								finish = true;
							}
							else {
								s.c_volume -= (Math.abs(s.to - s.init) / s.f_time);
							}
							// Hack to INDEX_SIZE_ERR: DOM Exception 1 
							if (s.c_volume < .001) { 
								s.c_volume = 0;
							}
						}
						if (this._manager) {
						  s.sound.setVolume(s.c_volume * 100);
						}
						else {
						  s.sound.volume = s.c_volume;
						}
						if (finish) {
							if (s.callback) s.callback.call(s.sound);
								delete this._fade[key];
							break;
						}
					}
				}
			}
		},
		
		Canvas:  {
			"new": function(id) {
				return Class["new"]("Canvas", [id]);
			}
		},
		
		Element: {
			"new": function(scene, layer, width, height) {
				return Class["new"]("Element", [scene, layer, width, height]);
			}
		},
		
		Context:  {
			"new": function(layer) {
				return Class["new"]("Context", [layer]);
			}
		},
		
		Scene: 	{
				  _scenes: {},
				  _cacheScene: {},
				  _scenesEnabled: {},
				  _scenesNbCall: {},
				  _current: null,
				  
				  New: function() { return this["new"].apply(this, arguments); },
				  "new": function(obj) {
					var _class;
					if (typeof obj == "string") {
						if (!this._cacheScene[obj]) {
							throw "Please initialize '" + obj + "' scene with an object before";
						}
						obj = this._cacheScene[obj];
					}
					else {
						this._cacheScene[obj.name] = obj;
					}
					_class = Class["new"]("Scene", [obj]).extend(obj, false);
					this._scenesNbCall[obj.name] = 0;
					this._scenes[obj.name] = _class;
					return _class;
				  },
/**
@doc scene/
@method call Called a scene. Call the method "exit" of the current scene (if any) and changes of scene
@param {String} scene name
@param {Object} (optional) params Display settings of the scene

* overlay {Boolean} : Displays the scene over the previous scenes without leave
* exitScenes {Object} : Parameter to indicate which scene to leave and when
	* allExcept (optional) {Array} : Names of other scenes not to leave
	* when (optional) {String} : When should I leave the scenes calling the scene
		* "afterPreload" : When the scene is called preloaded
@return {CanvasEngine.Scene}
@example

"canvas" is the variable initialized for CanvasEngine

	canvas.Scene.call("SceneName");


Superimposed scenes

	canvas.Scene.call("SceneName", {
		overlay: true
	});


Leaving the other scenes after preloading of the scene called

	canvas.Scene.call("SceneName", {
		exitScenes: {
			when: "afterPreload"
		}
	});

*/
				  call: function(name, params) {
					if (this._scenesNbCall[name] > 0) {
						this.New(name);
					}
					var _class = this._scenes[name], _allExcept = [name];
					params = params || {};
					if (_class) {
						this._scenesEnabled[name] = _class;
						if (params.exitScenes) {
							params.exitScenes.allExcept = params.exitScenes.allExcept || [];
							params.exitScenes.allExcept = _allExcept.concat(params.exitScenes.allExcept);
							_class._load.call(_class, params.exitScenes, params.params);
						}
						else {
							if (!params.overlay) this.exitAll(_allExcept);
							_class._load.call(_class, {}, params.params);
						}
						this._scenesNbCall[name]++;
					}
					else {
						throw "Scene \"" + name + "\" doesn't exist";
					}
					return _class;
				  },
/**
@doc scene/
@method exit Leave a scene
@param {String} scene name
@example

	canvas.Scene.exit("SceneName");

*/
				  exit: function(name) {
					var _class = this._scenesEnabled[name];
					if (_class) {
						_class._exit.call(_class);
						delete this._scenesEnabled[name];
					}
				  },
/**
@doc scene/
@method isEnabled Whether the scene is displayed
@param {String} scene name
@return {Boolean}
@example

	if (canvas.Scene.isEnabled("SceneName")) {}

*/
				   isEnabled: function(name) {
						return this._scenesEnabled[name] ? true : false;
				   },
				   
/**
@doc scene/
@method exitAll Disables all scenes except one or more scene
@param {String|Array} scene name or array of scene name
@example

	canvas.Scene.exitAll("SceneName");

*/
				   exitAll: function(exception) {
						var key;
						if (!(exception instanceof Array)) {
							exception = [exception];
						}
						for (key in this._scenesEnabled) {
							if (_CanvasEngine.inArray(key, exception)) {
								this.exit(key);
							}
						}
				   },
				   
/**
@doc scene/
@method exist Return true if the scene exist
@param {String} scene name
@return {Boolean}
@example

	if (canvas.Scene.exist("SceneName")) {}

*/
				  exist: function(name) {
					return this._scenes[name] ? true : false;
				  },
/**
@doc scene/
@method get Get scene
@param {String} scene name
@return {CanvasEngine.Scene}
@example

	var scene = canvas.Scene.get("SceneName");
	scene.pause(true);

*/
				  get: function(name) {
					return this._scenes[name];
				  },
				  
/**
@doc scene/
@method getEnabled Get activated scenes
@return {Object}
@example

	var scenes = canvas.Scene.getEnabled();
	for (var name in scenes) {
		console.log(name);
	}

*/
				  getEnabled: function() {
					return this._scenesEnabled;
				  },
				 
				  _loop: function(canvas) {
						var self = this;
						 
						function loop() {	
							var key,  i=0;
							
							CanvasEngine.Sound._loop();
							
							canvas[i].clear();
							canvas[i]._ctxMouseEvent.clearRect(0, 0, canvas[i].width, canvas[i].height);
							
							for (key in self._scenesEnabled) {
								self._scenesEnabled[key]._loop();
							}
							
							requestAnimationFrame(loop);
						}
						
						requestAnimationFrame(loop);
				 },
			}
	});
	
/**
	@doc canvas
	@class Canvas Manage canvas element
	@example
		
<jsfiddle>WebCreative5/GkUsE</jsfiddle>
*/
	Class.create("Canvas", {
		id: null,
		element: null,
		stage: null,
		ctx: null,
		_globalElements: {},
		_ctxTmp: null,
		_ctxMouseEvent: null,
/**
@doc canvas/
@property width canvas width
@type Integer
@example

<jsfiddle>WebCreative5/GkUsE</jsfiddle>
*/
		width: 0,
/**
@doc canvas/
@property height canvas height
@type Integer
*/
		height: 0, 
		mouseEvent: false,
		initialize: function(id) {
			var self = this;
			this.id = id;
			this.element = this._getElementById(id);
			this.width = this.element.width;
			this.height = this.element.height;
			this.ctx = this.element.getContext('2d');
			this.hammerExist = typeof(Hammer) !== "undefined";
			old = this.ctx;
			this._mouseEvent();
			var events = ["click", "dbclick", "mousemove"],
				hammer_events = ["dragstart", "drag", "dragend", "swipe", "tap", "doubletap", "hold", "transformstart", "transform", "transformend", "release"];
			
			var hammer = null;
			if (this.hammerExist) {
				hammer = new Hammer(this.element);
			}
			
			function bindEvent(type) {
				this.element.addEventListener(type, function(e) {
					callback(e, type);
				}, false);
			}
			
			function bindHammer(type) {
				hammer['on' + type] = function(e) { 
					callback(e, type);
				};
			}
			
			function callback(e, type) {
				var touches, mouse, scenes = CanvasEngine.Scene.getEnabled(), stage;
				if (e.originalEvent) {
					touches = e.touches;
				}
				else {
					touches = [self.getMousePosition(e)];
				}

				for (var name in scenes) {
					stage = scenes[name].getStage();
					for(var t=0; t < touches.length; t++) {
						stage._select(touches[t], function(el_real) {
							 el_real.trigger(type, e, touches[t]);
						});
					}
				}
			}
			
			if (hammer) {
				for (var i=0 ; i < hammer_events.length ; i++) {
					bindHammer.call(this, hammer_events[i]);
				}
			}
			for (var i=0 ; i < events.length ; i++) {
				bindEvent.call(this, events[i]);
			}
			
		},
		_elementsByScene: function(name, key, val) {
			if (!this._globalElements[name]) this._globalElements[name] = {};
			if (!val) {
				if (key) {
					return this._globalElements[name][key];
				}
				return this._globalElements[name];
			}
			this._globalElements[name][key] = val;
		},
		_getElementById: function(id) {
			var canvas;
			
			if (params.cocoonjs) {
				canvas = document.createElement("canvas");
				canvas.width = params.cocoonjs.width;
				canvas.height = params.cocoonjs.height;
				canvas.id = id;
				document.body.appendChild(canvas);
			}
			else {
				canvas = document.getElementById(id);
			}
			
			return canvas;
		},
		_mouseEvent: function() {
			var canvas =  document.createElement('canvas');
			canvas.width = this.width;
			canvas.height = this.height;
			this._ctxMouseEvent = canvas.getContext('2d');
			//document.body.appendChild(canvas);
		},
		canvasReady: function() {
		},
/**
@doc canvas/
@method Get the X and Y position of the mouse in the canvas
@param {Event} event
@return Object
@example

	var el = this.createElement(), self = this;
	el.on("click", function(e) {
		var pos = self.getCanvas().getMousePosition(e);
		console.log(pos.x, pos.y);
	});

*/
		getMousePosition: function(e) {
			var obj = this.element;
			var top = 0;
			var left = 0;
			while (obj && obj.tagName != 'BODY') {
				top += obj.offsetTop;
				left += obj.offsetLeft;
				obj = obj.offsetParent;
			}
			var mouseX = e.clientX - left + window.pageXOffset;
			var mouseY = e.clientY - top + window.pageYOffset;
			return {x: mouseX, y: mouseY};
		},
/**
@doc canvas/
@method measureText Returns an object that contains the width of the specified text
@param {String} txt Text
@param {String} font_size (optional) Font Size (default 12px);
@param {String} font_family (optional) Font Family (default Arial);
@return Object
@example
	
In method "ready" of the scene : 
	
		var _canvas = this.getCanvas();
		_canvas.measureText("Hello World").width;
	
*/
		measureText: function(txt, font_size, font_family) {
			var val;
			font_family = font_family || "Arial";
			font_size = font_size || "12px";
			this.ctx.font = "normal " + font_size + " " + font_family;
			val = this.ctx.measureText(txt);
			this.ctx.font = null;
			return val;
		},
		
/**
@doc canvas/
@method createPattern Returns a pattern
@param {String|Image|HTML5CanvasElement|HTML5VideoElement} img Identifier of the preloaded image, image, video or canvas
@param {Sring} repeatOption (optional) repeat (default), no-repeat, repeat-x or repeat-y
@return CanvasPattern
@example
	
In method "ready" of the scene : 
	
		var _canvas = this.getCanvas(),
			pattern = _canvas.createPattern("my_img");
		
		var el = this.createElement();
		el.fillStyle = pattern;
		el.fillRect(0, 0, 100, 100);
		stage.append(el);
	
*/
		createPattern: function(img, repeatOption) {
			repeatOption = repeatOption || "repeat";
			return this.ctx.createPattern(CanvasEngine.Materials.get(img), repeatOption);
		},
		
/**
	@doc canvas/
	@method createLinearGradient View http://www.w3schools.com/tags/canvas_createlineargradient.asp
*/
		createLinearGradient: function(x0, y0, x1, y1) {
			return this.ctx.createLinearGradient(x0, y0, x1, y1);
		},
		
/**
	@doc canvas/
	@method createRadialGradient View http://www.w3schools.com/tags/canvas_createradialgradient.asp
*/
		createRadialGradient: function(x0,y0,r0,x1,y1,r1) {
			return this.ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
		},
		
/**
	@doc canvas/
	@method addColorStop View http://www.w3schools.com/tags/canvas_addcolorstop.asp
*/
		addColorStop: function(stop, color) {
			return this.ctx.addColorStop(stop, color);
		},
		
/**
	@doc canvas/
	@method clear Erases the content of canvas
*/
		clear: function() {
			return this.ctx.clearRect(0, 0, this.width, this.height);
		}
	});
	
/**
@doc scene
@class Scene Scene management. Structure of a scene :

	canvas.Scene.new({
		name: "MyScene",
		materials: {
			images: {},
			sounds: {}
		},
		preload: function(stage, pourcent) {
		
		},
		ready: function(stage) {
			
		},
		render: function(stage) {
		
		},
		exit: function(stage) {
		
		}
	});

All parameters except "name" are optional. The "new" method created a scene but does not run. To execute:

	canvas.Scene.call("MyScene");

The resources defined in "Materials" are loaded and regularly calls the method "preload" with the current percentage. When charging is completed, the method "ready" is executed only once. When the method "ready" is complete, the method "render" is called loop. If you call another scene, the method "exit" of the current scene is triggered
"stage" is an object of type "Element". This is the main element of the scene containing all child elements to create.
*/
	Class.create("Scene", {
		_stage: {},
		_events: [],
		_pause: false,
		_isReady: false,
/**
@doc scene/
@property model Model reference. The methods of this property are the same as scoket.io
@type Object
@default null
@example

<script src="extends/Socket.js"></script>/code>

	
	var Model = io.connect('http://127.0.0.1:8333');

	var canvas = CE.defines("canvas").
		ready(function() {
		canvas.Scene.call("MyScene");
	 });

	canvas.Scene.new({
	  name: "MyScene",
	  model: Model,
	  events: ["load"], 
	  ready: function(stage) {
		this.model.emit("start");
	  },
	  load: function(text) {
		 console.log(text);
	  }
	});



*/
		model: null,
		//_isExit: false,
		initialize: function(obj) {
			var ev, self = this;
			this._events = obj.events;
		},
		_loop: function() {
			if (this._isReady) {
				if (this._pause) {
					this._stage.refresh();
				}
				else {
					if (this.render) {
						this.render.call(this, this._stage);
					}
					else {
						this._stage.refresh();
					}
				}
			}
		},
		// deprecated
		emit: function(name, data) {
			this.model.call(name, data);
		},
		// deprecated
		getElement: function(name) {
			if (this._global_elements[name]) {
				return this._global_elements[name];
			}
			return this.createElement(name);
		},
		
/**
@doc scene/
@method pause Pause the scene. method "render" is not called however, but the scene is refreshed (except the event "canvas: render")
@param {Boolean} val (optional) The scene is paused if the value is "true". Put "false" to turn pause off. If the parameter is not specified, the current value is returned.
@return {Boolean|Scene}
@example
	
	In "ready" method of the scene :
	
		this.pause(true); // return this Scene Class
		console.log(this.pause()); // return true
	
*/
		pause: function(val) {
			if (val === undefined) {
				return this._pause;
			}
			this._pause = val;
			return this;
		},
		
/**
@doc scene/
@method togglePause Pauses if the game is not paused, and vice versa. View pause method
@return {Scene}
@example
	
	In "ready" method of the scene :
	
		console.log(this.pause()); // return false
		this.togglePause(); // return this Scene Class
		console.log(this.pause()); // return true
	
*/
		togglePause: function() {
			return this.pause(!this._pause);
		},
		
/**
	@doc scene/
	@method getStage Return the highest element
	@return {CanvasEngine.Element}
*/
		getStage: function() {
			return this._stage;
		},
		
/**
	@doc scene/
	@method getCanvas Get the canvas
	@param {Integer} id (optional) Position in array
	@return {HTMLCanvasElement}
*/
		getCanvas: function(id) {
			if (!id) id = 0;
			return CanvasEngine.el_canvas[id];
		},
/**
@doc scene/
@method createElement Create an element
@param {String} name (optional) 
@param {Integer} width (optional) 
@param {Integer} height (optional) 
@example

In the method "ready" in the scene class :

	var el = this.createElement();

--

	var el = this.createElement("foo");

--

	var el = this.createElement(100, 100);
	
--
Create two elements : 

	var els = this.createElement(["foo", "bar"]);
	stage.append(els.foo, els.bar);

*/
		 createElement: function(name, width, height) {
			if (name instanceof Array) {
				var obj = {};
				for (var i=0 ; i < name.length ; i++) {
					obj[name[i]] = this.createElement(name[i]);
				}
				return obj;
			}
			if (typeof name != "string") {
				height = width;
				width = name;
			}
			var el = CanvasEngine.Element["new"](this, null, width, height);
			el.name = name;
			return el;
		 },
		 
		_exit: function() {	
			this.getCanvas()._elementsByScene[this.name] = {};
			if (this.exit) this.exit.call(this);
		},
		_load: function(params, options) {
			var self = this;
			params = params || {};
			options = options || {};
			this._stage = CanvasEngine.Element["new"](this);
			for (var i=0 ; i < CanvasEngine.el_canvas.length ; i++) {
				CanvasEngine.el_canvas[i].stage = this._stage;
			}
			if (this.model) {		
				if (this._events) {
					CE.each(this._events, function(i, val) {
						self.model.on(val, function(data) {
							self[val].call(self, data);
						});
					});
				}
			}
			
			var images_length = materialLength("images"),
				sound_length = materialLength("sounds"),
				font_length = materialLength("fonts"),
				total = images_length + sound_length + font_length,
				current = 0;
				
			if (images_length > 0) {
				materialLoad("images");
			}
			if (sound_length > 0) {
				materialLoad("sounds");
			}
			if (font_length > 0) {
				materialLoad("fonts");
			}
			if (images_length == 0 && sound_length == 0 && font_length == 0) {
				canvasReady();
			}
			
			function materialLoad(type) {
				CanvasEngine.Materials.load(type, self.materials[type], function() {
					preload();
				});
			}
			
			function preload() {
				current++;
				if (self.preload) self.preload(self._stage, current / total * 100);
				if (total == current) {
					canvasReady();
				}
			}
			
			function materialLength(type) {
				var i=0;
				if (!self.materials) {
					return 0;
				}
				if (self.materials[type]) {
					for (var key in self.materials[type]) {
						i++;
					}
				}
				return i;
			}
			
			function canvasReady() {
				if (params.when == "afterPreload") {
					CanvasEngine.Scene.exitAll(params.allExcept);
				}
				if (self.ready) self.ready(self._stage, self.getElement, options);
				self._stage.trigger("canvas:readyEnd");
				if (self.model && self.model.ready) self.model.ready.call(self.model);
				self._isReady = true;
			}
		}
	});
	
/**
@class Context
@extend Element Uses the HTML5 Canvas context of the element. The drawing is stored in an array and is not displayed as the item is not attached to the scene

	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {
			var element = this.createElement();
			element.fillStyle = #ff0000;
			element.fillRect(20, 20, 100, 100);
			stage.append(element);
		}
	});

*/
	Class.create("Context", {
			_cmd: {},
			img: {},
			globalAlpha: 1,
			// private ; read only
			_PROPS: ["shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "globalAlpha", "globalCompositeOperation", "lineJoin", "lineWidth", "miterLimit", "fillStyle", "font", "textBaseline", "strokeStyle"],
			
			alpha: function(opacity) {
				//this.globalAlpha = opacity;
			},
			
/**
@doc draw/
@method addMethod Adds methods for 2d context
@param {String|Array} names Method(s) Name(s)
@param {String} type (optional) Type of the method:

* cmd (by default) : Command that applies after a refresh
* draw : The method runs directly

@example

	var el = this.createElement();
	el.addMedthod("newMethodCanvas");
	el.newMethodCanvas(foo, bar);
	stage.append(el);

*/
			addMethod: function(names, type) {
				var self = this;
				type = type || "cmd";
				if (!(names instanceof Array)) {
					names = [names];
				}
				
				function addCmd(name) {
					self[name] = function() {
						var method = type == "cmd" ? "_addCmd" : "draw";
						self[method](name, arguments);
					};
				}
				
				for (var i=0 ; i < names.length ; i++) {
					addCmd(names[i]);
				}
				
			},
			
/**
	@doc draw/
	@method fillRect. See http://www.w3schools.com/html5/canvas_fillrect.asp
*/
			fillRect: function(x, y, w, h) {
				this._addCmd("fillRect", [x, y, w, h], ["fillStyle"]);
			},
/**
	@doc draw/
	@method fill See http://www.w3schools.com/html5/canvas_fill.asp
*/
			fill: function() {
				this._addCmd("fill", [], ["fillStyle"]);
			},
			/**
				@doc draw/
				@method fillText See http://www.w3schools.com/html5/canvas_filltext.asp
			*/
			fillText: function(text, x, y) {
				this._addCmd("fillText", [text, x, y], ["fillStyle", "font", "textBaseline"]);
			},
			/**
				@doc draw/
				@method strokeText See http://www.w3schools.com/html5/canvas_stroketext.asp
			*/
			strokeText: function(text, x, y) {
				this._addCmd("strokeText", [text, x, y], ["strokeStyle", "font", "textBaseline"]);
			},
			/**
				@method strokeRect See http://www.w3schools.com/html5/canvas_strokerect.asp
			*/
			strokeRect: function(x, y, w, h) {
				this._addCmd("strokeRect", [x, y, w, h], ["strokeStyle"]);
			},
			/**
				@doc draw/
				@method stroke See http://www.w3schools.com/html5/canvas_stroke.asp
			*/
			stroke: function() {
				this._addCmd("stroke", [], ["strokeStyle"]);
			},
			/**
				@doc draw/
				@method addColorStop See http://www.w3schools.com/html5/canvas_addcolorstop.asp
			*/
/**
@doc draw/
@method drawImage Draws the image or part of the image
@param {String|Image|Canvas} img If this is a string, this is the identifier of the preloaded image
@param {Integer} sx (optional) 
@param {Integer} sy (optional) 
@param {Integer} sw (optional) 
@param {Integer} sh (optional) 
@param {Integer} dx (optional) 
@param {Integer} dy (optional) 
@param {Integer} dw (optional) 
@param {Integer} dh (optional) 
@example

In the method "ready" in the scene class :

	var el = this.createElement();
	el.drawImage("img");

--

	el.drawImage("img", 10, 30);

--

	el.drawImage("img", 10, 30, 100, 100, 0, 0, 100, 100);

--

	el.drawImage("img", 0, 0, "30%");

@link http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-drawimage
*/
			drawImage: function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
				var array, array_buffer, buffer, _img = img;
				if (!sx) sx = 0;
				if (!sy) sy = 0;
				if (typeof img === "string") {
					_img = CanvasEngine.Materials.get(img);
					if (!_img) {
						return;
					}
					this.img.width = _img.width;
					this.img.height = _img.height;
				}
				if (/%$/.test(sw)) {
					dx = sx;
					dy = sy;
					sx = 0;
					sy = 0;
					sw = _img.width * parseInt(sw) / 100;
					sh = _img.height;
					dw = sw;
					dh = sh;
				}
				
				
				//buffer = CanvasEngine.Materials.createBuffer(img, this.color_key);
		
				
				function f(t) {
					for (var i=1 ; i < t.length ; i++) {
						t[i] = Math.round(t[i]);
					}
					return t;
				}
				
				if (sw !== undefined) {
					array = [_img, sx, sy, sw, sh, dx, dy, dw, dh];
					this._buffer_img = {
						x: dx,
						y: dy,
						width: dw,
						height: dh
					};
					//array_buffer = f([buffer, sx, sy, sw, sh, dx, dy, dw, dh]);
				}
				else {
					array = [_img, sx, sy];
					this._buffer_img = {
						x: sx,
						y: sy,
						width: _img.width,
						height: _img.height
					};
					
					//array_buffer = f([buffer, sx, sy]);
				}
				
				this._addCmd("drawImage", array);
			},
			/**
				@doc draw/
				@method arc See http://www.w3schools.com/html5/canvas_arc.asp
			*/
			/**
				@doc draw/
				@method clip See http://www.w3schools.com/html5/canvas_clip.asp
			*/
			/**
				@doc draw/
				@method beginPath See http://www.w3schools.com/html5/canvas_beginpath.asp
			*/
			/**
				@doc draw/
				@method moveTo See http://www.w3schools.com/html5/canvas_beginpath.asp
			*/
			/**
				@doc draw/
				@method closePath See http://www.w3schools.com/html5/canvas_closepath.asp
			*/
			/**
				@doc draw/
				@method translate http://www.w3schools.com/html5/canvas_translate.asp
			*/
			/**
				@doc draw/
				@method rotate See http://www.w3schools.com/html5/canvas_rotate.asp
			*/


			/**
				@doc draw/
				@method rotateDeg Degree rotation
				@param {Integer} deg 
			*/
			rotateDeg: function(deg) {
				this.rotate(deg * Math.PI / 180);
			},
			/**
				@doc draw/
				@method scale See http://www.w3schools.com/html5/canvas_scale.asp
			*/
			
			/**
				@doc draw/
				@method clearRect See http://www.w3schools.com/html5/canvas_clearrect.asp
			*/
			/**
				@doc draw/
				@method setTransform See http://www.w3schools.com/html5/canvas_settransform.asp
			*/
			/**
				@doc draw/
				@method transform See http://www.w3schools.com/html5/canvas_transform.asp
			*/
			/**
				@doc draw/
				@method rect See http://www.w3schools.com/html5/canvas_rect.asp
			*/
			/**
				@doc draw/
				@method save Saves the state of the current context
				@param {Boolean} cmd (optional) If false, the method applies directly. false by default
			*/
			save: function(cmd) {
				if (cmd) {
					this._addCmd("save");
				}
				else {
					this.draw("save");
				}
			},
			/**
				@doc draw/
				@method restore Returns previously saved path state and attributes
				@param {Boolean} cmd (optional) If false, the method applies directly. false by default
			*/
			restore: function(cmd) {
				if (cmd) {
					this._addCmd("restore");
				}
				else {
					this.draw("restore");
				}
			},
			/**
				@doc draw/
				@method clearPropreties Assigned undefined to all properties HTML5 Canvas element
			*/
			clearPropreties: function() {
				var prop = this._PROPS;
				for (var k=0 ; k < prop.length ; k++) {
					if (this[prop[k]]) this[prop[k]] = undefined;
				}
				
			},
			draw: function(name, params, propreties) {
			
				//CE.benchmark("draw method");
				layer =  "ctx";
				params = params || [];
				propreties = propreties || {};

				var ctx = this.getScene().getCanvas()._ctxTmp;
				var cmd, array_cmd = {};
				var cmd_propreties = [];
				var isCmd = true, applyBuffer = 1, bufferEventForce = false;
				
				var bufferEvent = function(name, _params) {
					var ctx_mouse = this._canvas[0]["_ctxMouseEvent"];
					if (this.hasEvent() || this.hasCmd("clip")) {
						ctx_mouse[name].apply(this._canvas[0]["_ctxMouseEvent"], _params);
						if (name == "drawImage") {
							ctx_mouse.globalCompositeOperation = 'source-atop';
							ctx_mouse.fillStyle = '#' + this.color_key;
							ctx_mouse.fillRect(this._buffer_img.x, this._buffer_img.y, this._buffer_img.width, this._buffer_img.height);
						}
					}
				};
				
				var bufferProp = function(cmd_propreties, key, value) {
					if (cmd_propreties[key] || this.forceEvent) {
						this._canvas[0]["_ctxMouseEvent"][key] = value;
						return 0;
					}
					return 1;
				};
				
				if (name && typeof name != "string") {
					ctx = name;
					name = null;
				}
				if (name) {
					array_cmd[name] = {params: params, propreties: propreties};
					isCmd = false;
				}
				else {
					array_cmd = this._cmd;
				}
				for (var name in array_cmd) {
					cmd = array_cmd[name];
					for (var j=0 ; j < this._canvas.length ; j++) {
						cmd_propreties = cmd.propreties;
						if (isCmd && name == "restore") {	
							this.clearPropreties();
						}
						if (cmd_propreties) {
							for (var key in cmd_propreties) {
								applyBuffer = 1;
								
								if (key == "globalAlpha") {
									cmd_propreties[key] = this.real_opacity;
								}
								
								if (ctx) {
									ctx[key] = cmd_propreties[key];
								}
								else {
									this._canvas[j][layer][key] = cmd_propreties[key];
								}
								
								applyBuffer &= bufferProp.call(this, cmd_propreties, "globalAlpha", 1);
								applyBuffer &= bufferProp.call(this, cmd_propreties, "strokeStyle", '#' + this.color_key);
								applyBuffer &= bufferProp.call(this, cmd_propreties, "fillStyle", '#' + this.color_key);
								
								if (applyBuffer) {
									bufferProp.call(this, cmd_propreties, key, cmd_propreties[key]);
								}
								
							}
						}
						if (ctx) {
							ctx[name].apply(ctx, cmd.params);
						}
						else {
							this._canvas[j][layer][name].apply(this._canvas[j][layer], cmd.params);
							if (this.forceEvent) {
								if (name == "rect") {
									bufferEvent.call(this, "fillRect", cmd.params);
								}
							}
							bufferEvent.call(this, name, cmd.params);
						}
					}
				}
				//CE.benchmark("draw method");

			},
			_addCmd: function(name, params, propreties) {
				params = params || [];
				propreties = propreties || [];
				
				var prop = this._PROPS;
				propreties = propreties.concat(prop);
				var obj = {};
				for (var k=0 ; k < propreties.length ; k++) {
					if (this[propreties[k]]) obj[propreties[k]] = this[propreties[k]];
				}
				obj["globalAlpha"] = 1;
				this._cmd[name] = {params: params, propreties: obj};
			},
			
			hasCmd: function(name) {
				return this._cmd[name];
			},
/**
@doc draw/
@method removeCmd Deletes a saved command element
@param {String} name Name of the drawing method
@example

In `ready` method :

	var el = this.createElement();
	el.drawImage("foo");
		
	el.removeCmd("drawImage");
	stage.append(el); // Image "foo" is not displayed

*/
			removeCmd: function(name) {
				delete this._cmd[name];
			}
	});
	
	
/**
@doc element
@class Element Manipulate elements on the scene.

1. Create an element with the createElement method :

	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {
			var element = this.createElement(); // new Element object
		}
	});

2. Add this element in the stage :

	canvas.Scene.new({
		name: "MyScene",
		ready: function(stage) {
			var element = this.createElement();
			stage.append(element); // add in the stage
		}
	});
	
@example
<jsfiddle>cUEJ7/1</jsfiddle>
*/
	Class.create("Element", {
		_children: [],
		_attr: {},
		/**
			@doc manipulate/
			@property x Position X relative to the parent
			@type Integer
			@default 0
		*/
		x: 0,
		/**
			@doc manipulate/
			@property y Position Y relative to the parent
			@type Integer
			@default 0
		*/
		y: 0,
		real_x: 0,
		real_y: 0,
		/**
			@doc manipulate/
			@property scaleX Scale in X. Value 1 equivalent to 100%
			@type Integer
			@default 1
		*/
		scaleX: 1,
		/**
			@doc manipulate/
			@property scaleY Scale in Y. Value 1 equivalent to 100%
			@type Integer
			@default 1
		*/
		scaleY: 1,
		/**
			@doc manipulate/
			@property skewX Shew in X.
			@type Integer
			@default 0
		*/
		skewX: 0,
		/**
			@doc manipulate/
			@property skewY Shew in Y.
			@type Integer
			@default 0
		*/
		skewY: 0,
		/**
			@doc manipulate/
			@property opacity Opacity. Value 1 equivalent to 100%
			@type Integer
			@default 1
		*/
		opacity: 1,
		/**
			@doc manipulate/
			@property rotation Rotation.
			@type Integer
			@default 0
		*/
		rotation: 0,
/**
@doc manipulate/
@property width Width. Only if  value has been assigned to the creation of the element
@type Integer
@default null
@example

	var foo = this.createElement(10, 20);
		console.log(foo.width) // 10

*/
		width: null,
/**
@doc manipulate/
@property height Height. Only if  value has been assigned to the creation of the element
@type Integer
@default null
@example

	var foo = this.createElement(10, 20);
		console.log(foo.height) // 20

*/
		height: null,
		/**
			@doc manipulate/
			@property regX Position X of the point of origin.
			@type Integer
			@default 0
		*/
		regX: 0,
		/**
			@doc manipulate/
			@property regY Position Y of the point of origin.
			@type Integer
			@default 0
		*/
		regY: 0,
		/**
			@doc traversing/
			@property parent Parent element
			@type CanvasEngine.Element
		*/
		parent: null,
		// TODO
		pause: false,
		_index: 0,
		_id: null,
		_visible: true,
		_listener: {},
		_buffer_img: null,
		_out: 1,
		_over: 0,
		_pack: null,
/**
	@doc manipulate/
	@property forceEvent Force applying an event on the element even if it is invisible. Assign the height and width or use the rect method before
	@type Boolean
	@default false
*/
		forceEvent: false,
/**
	@doc manipulate/
	@property propagationOpacity If false, does not take into account the opacity of parent elements
	@type Boolean
	@default true
*/
		propagationOpacity: null,
		initialize: function(scene, layer, width, height) {
			this._id = _CanvasEngine.uniqid();
			this.width = width;
			this.height = height;
			this.scene = scene;
			this.stage = scene._stage;
			this.layer = layer;
			
			var key, elements = this.scene.getCanvas()._elementsByScene(this.scene.name);
			do {
				key = _CanvasEngine._getRandomColorKey();
			}
			while (key in elements);
			
			
			this.addMethod([
				"moveTo",
				"lineTo",
				"quadraticCurveTo",
				"bezierCurveTo",
				"clip",
				"beginPath",
				"closePath",
				"rect",
				"arc",
				"addColorStop"
			], "cmd");
			
			this.addMethod([
				"rotate",
				"translate",
				"transform",
				"setTransform",
				"resetTransform",
				"scale",
				"clearRect"
			], "draw");
			
			this.color_key = key;
			this.scene.getCanvas()._elementsByScene(this.scene.name, key, this);
			this._canvas = CanvasEngine.el_canvas;
		},
/**
@doc draw/
@method refresh Refreshes the elements of the scene	
@event canvas:refresh Calling the event only "stage" to each refresh of an element :

	stage.on("canvas:refresh", function(el) { // stage is defined in the scene
		console.log(el);
	});

*/
		refresh: function() {
			//this.clear();
			this._refresh(true);
			this._canvas._event_mouse = null;
		},
		/**
			Private
			init : is parent ? default : false
			children : refresh children ? default : true
		
		*/
		_refresh: function(init, children, ctx) {
			children = children === undefined ? true : children;
			

			if (this.stage.trigger) this.stage.trigger("canvas:refresh", this);
			
			if (!this._visible) {
				this._loop();
				return;
			}

			if (!this.real_pause) {

				if (init || !this.parent) {
					this.parent = {
						scaleX: 1,
						scaleY: 1,
						real_x: 0,
						real_y: 0,
						real_scale_x: 1,
						real_scale_y: 1,
						real_rotate: 0,
						real_skew_x: 0,
						real_skew_y: 0,
						real_opacity: 1,
						real_propagation: true
					};
				}
				
				this.real_propagation = this.parent.propagationOpacity == null ? true : this.parent.propagationOpacity;
			
				this.save();
					
				this.setTransform(1, 0, 0, 1, 0, 0);
				
				this.real_scale_x = this.parent.real_scale_x * this.scaleX;
				this.real_scale_y = this.parent.real_scale_y * this.scaleY;
				this.real_y = (this.parent.real_y + this.y) * (this.parent.scaleY == 1 ? 1 : this.parent.real_scale_x);
				this.real_x = (this.parent.real_x + this.x) * (this.parent.scaleX == 1 ? 1 : this.parent.real_scale_y);
				
				this.real_skew_x = this.parent.real_skew_x + this.skewX;
				this.real_skew_y = this.parent.real_skew_y + this.skewY ;
				this.real_rotate = this.parent.real_rotate + this.rotation ;
				if (this.real_propagation) {	
					this.real_opacity = this.parent.real_opacity * this.opacity;
				}
				else {
					this.real_opacity = this.opacity;
				}
				
				this.real_pause = init ? this.pause : this.parent.real_pause;
				
				this.globalAlpha = this.real_opacity;
				if (this.parent) {
					if (this.parent.regX) {
						this.regX = this.parent.regX;
					}
					if (this.parent.regY) {
						this.regY = this.parent.regY;
					}
				}
				var regX = this.real_x + this.regX;
				var regY = this.real_y + this.regY;
				this.translate(regX, regY);
				if (this.rotation != 0) {
					this.rotateDeg(this.rotation);
				}
				this.scale(this.real_scale_x, this.real_scale_y);
				this.transform(1, this.real_skew_x, this.real_skew_y, 1, 0, 0);
				this.translate(this.real_x,  this.real_y);
				this.translate(-regX, -regY);
			}
			
			
			this.draw(ctx);
			
			if (!this.hasCmd("clip")) {
				this.restore();
			}
		
			
			if (children) {
				// if (!this.real_pause) this._loop();
				if (!this.getScene()._pause) this._loop();
				for (var i=0 ; i < this._children.length ; i++) {
					this._children[i]._refresh(false, true, ctx);
				}
			}
			
			if (this.hasCmd("clip")) {
				this.restore();
			}
		},
		/**
			@doc manipulate/
			@method rotateTo A rotation element in a direction
			@param {Integer|String} val In degrees. To select the unit, add the suffix: "deg" or "rad". Example : "10rad" or "90deg"
			@param {Boolean} counterclockwise (optional) Direction of rotation. true: counterclockwise (false by default)
			@return CanvasEngine.Element
		*/
		rotateTo: function(val, counterclockwise) {
			var _val = parseInt(val);
			if (/rad$/.test(val)) {
				_val = _val * 180 / Math.PI;
			}
			
			this.rotation = counterclockwise ? 360 - _val : _val;
			this._stageRefresh();
			return this;
		},
		/**
			@doc manipulate/
			@method setOriginPoint Defining the position of the point of origin. This amounts to assign values to properties regX and regY
			@param {Integer} x position X
			@param {Integer} y position Y
			@return CanvasEngine.Element
		*/
		/**
			@method setOriginPoint Designate the placement of the point of origin. By cons, you must define the size of the element
			@param {String} val Put "middle" position to the midpoint of the element
			@return CanvasEngine.Element
		*/
		setOriginPoint: function(x, y) {
			if (x == "middle") {
				if (this.width && this.height) {
					x = Math.round(this.width / 2);
					y = Math.round(this.height / 2);
				}
				else {
					throw "Width and Height proprieties are not defined";
				}
			}
			if (x !== undefined) this.regX = +x;
			if (y !== undefined) this.regY = +y;
			return this;
		},
		/**
			@doc traversing/
			@method getScene Get the scene where the element is attached
			@return Scene
		*/
		getScene: function() {
			return this.scene;
		},
		
		_stageRefresh: function() {
			this.stage.refresh();
		},
		
		_mousemove: function(e, mouse) {
			var el_real, over;
			for (var i=0 ; i < this._children.length ; i++) {
				el_real = this._children[i];
				over = mouse.x > el_real.real_x && mouse.x < el_real.real_x + el_real.width &&
						mouse.y > el_real.real_y && mouse.y < el_real.real_y + el_real.height;
						
				if (over) {
					if (el_real._out == 1) {
						el_real._out++;
						el_real._out++;
						el_real._over = 1;
						_trigger = el_real.trigger("mouseover", e);
					}
					if (_trigger) return;
				}
				else {
					if (el_real._over == 1) {
						el_real._out = 1;
						el_real._over++;
						_trigger = el_real.trigger("mouseout", e);
					}
				}
					
			}
		},

		_select: function(mouse, callback) {
			var el_real, imgData;
			var canvas = this.scene.getCanvas();
			
			imgData = this._canvas[0]["_ctxMouseEvent"].getImageData(mouse.x, mouse.y, 1, 1).data;
			if (imgData[3] > 0) {
				el_real = canvas._elementsByScene(this.scene.name, _CanvasEngine.rgbToHex(imgData[0], imgData[1], imgData[2]));
				if (el_real) callback(el_real);
			}
		},
		
		_click: function(e, mouse, type) {
			this._select(mouse, function(el_real) {
				 el_real.trigger("click", e, mouse);
			});
		},
		
		_cloneRecursive: function(el) {
			var sub_el, new_el;
			if (el._children.length > 0) {
				for (var i=0 ; i < el._children.length ; i++) {
					sub_el = el._children[i];
					new_el = this.scene.createElement();
					for (var key in sub_el) {
						if (typeof key != "function") {
							new_el[key] = sub_el[key];
						}
					}
					new_el.parent = el;
					this._cloneRecursive(sub_el);
				
					el._children[i] = new_el;
				}
			}
		},
		/**
			@doc manipulate/
			@method clone Creating a clone element
			@return CanvasEngine.Element
		*/
		clone: function() {
			var el = this.scene.createElement();
			for (var key in this) {
				if (typeof key != "function") {
					el[key] = this[key];
				}
			}
			this._cloneRecursive(el);
			return el;
		},
		
/**
	@doc manipulate/
	@method append inserts the specified content as the last child of each element in the Element collection
	@param {CanvasEngine.Element} el 
	@return CanvasEngine.Element
	@example

In method ready :

	var el = this.createElement();
	stage.append(el);
	
--

	var el1 = this.createElement(),
		el2 = this.createElement(),
		el3 = this.createElement();
	stage.append(el1, el2, el3);
	
--
	
	var el = this.createElement(["a", "b", "c"]);
	stage.append(el.a, el.b, el.c);
*/
		append: function() {
			var el;
			for (var i=0 ; i < arguments.length ; i++) {
				el = arguments[i];
				this._children.push(el);
				el.parent = this;
				el._index = this._children.length-1;
				el._refresh();				
			}
			return arguments;
		},
		
/**
@doc manipulate/
@method prepend inserts the specified content as the first child of each element in the Element collection
@example

In method ready

	var el = this.createElement();
	stage.prepend(el); // zIndex == 0
	
@param {CanvasEngine.Element} el 
@return CanvasEngine.Element
*/
		prepend: function(el) {
			this._children.push(el);
			el.parent = this;
			el.zIndex(0);
			return el;
		},
		
		// TODO
		/**
			var el1 = this.createElement();
			var el2 = this.createElement();
			el.insertAfter(stage);
		*/
		insertAfter: function(el) {
			var children = el.parent.children();
			children.push(this);
			this._index = children.length-1;
			return this;
		},
		
/**
	@doc traversing/
	@method children Retrieves an array of elements
	@param children (optional) {Array|Element} If the parameter exists, a new array of elements is assigned. You can copy the child of another element.
	@return {Array}
*/
		children: function(children) {
			var _children = [], new_children = [];
			if (children) {
				if (children instanceof Array) _children = children;
				if (children instanceof Class) _children = children.children();
				for (var i=0 ; i < _children.length ; i++) {
					new_children[i] = _children[i].clone();
					new_children[i].parent = this;
				}
				this._children = new_children;
			}
			return this._children;
		},

/**
@doc manipulate/
@method detach The .detach() method is the same as .remove(). This method is useful when removed elements are to be reinserted into the stage at a later time.
@example
In method ready

	var el = this.createElement();
	stage.append(el);
	
	el = el.detach(); // element is removed
	stage.append(el); 
	
@return {CanvasEngine.Element}
*/		
		detach: function() {
			this.remove();
			return this;
		},
		
/**
@doc manipulate/
@method pack Compress all children in an HTML5Canvas
@param {Integer} w Width of the compressed child
@param {Height} h Height of the compressed child
@param {Boolean} free_memory (optional) Do not keep the array in memory of the children if true. Unpack method can no longer be used out. (false by default)
@example
In method ready

	var el = this.createElement(), child;
	for (var i=0 ; i < 1000 ; i++) {
		child = this.createElement();
		child.x = i;
		el.append(child);
	}
	el.pack(10, 1000);
	stage.append(el);

@return {CanvasEngine.Element}
*/
		pack: function(w, h, free_memory) {
			var children = this.children(),
				canvas = document.createElement("canvas"),
				ctx = canvas.getContext('2d'),
				scene = this.getScene(),
				el;
			
			canvas.width = w;
			canvas.height = h;
			
			this.scene.getCanvas()._ctxTmp = ctx;
			for (var i=0 ; i < children.length ; i++) {
				this._children[i]._refresh();
			}
			this.scene.getCanvas()._ctxTmp = null;
			if (!free_memory) this._pack = children;
			this.empty();
			el = scene.createElement();
			el.drawImage(canvas);
			this.append(el);
			return this;
		},

/**
@doc manipulate/
@method unpack Decompress a compressed element with `pack` method
@example
In method ready

	var el = this.createElement(), child;
	for (var i=0 ; i < 1000 ; i++) {
		child = this.createElement();
		child.x = i;
		el.append(child);
	}
	el.pack(10, 1000); 	// transform all children to Canvas element
	el.unpack(); 		// reset as before 
	stage.append(el);

@return {CanvasEngine.Element}
*/		
		unpack: function() {
			if (!this._pack) {
				throw "Use the method pack before or impossible because you release the memory with method pack";
			}
			this._children = this._pack;
			this._pack = null;
			return this;
		},
		
		
		isAppend: function() {
			return this in this.parent.children();
		},
		
		first: function() {
			return this.children()[0];
		},
		
		find: function(name) {
			var children = this.children(),
				_find = [];
			for (var i=0 ; i < children.length ; i++) {	
				c = children[i];
				if (name == c.name) {
					_find.push(c);
				}
			}
			return _find;
		},
		
		findAttr: function(attr, val) {
			var children = this.children(),
				c, attr_val;
			for (var i=0 ; i < children.length ; i++) {
				c = children[i];
				console.log(attr, c.attr(attr));
				attr_val = c.attr(attr);
				if (attr_val) {
					if (val != undefined) {
						if (attr_val == val) {
							return c;
						}
					}
					else {
						return c;
					}
				}
			}
			return false;
		},
		
/**
@doc manipulate/
@method zIndex Change or get the index of the item. The index used to define the superposition. By default, the first element has index 0. If an item is created at the same level, it will overlay the previous element and its index will be 1
@param {Integer|Element}  index (optional) If the value is not specified, the current index of the element is returned. If the value is negative, you change the index from the end. If the value is an element, that element is placed after the element indicated
@example

In method ready

	var el1 = this.createElement(),
		el2 = this.createElement(),
		el3 = this.createElement();
					// Original order : el1 ; el2 ; el3
	el1.zIndex(1);  // New order : el2 ; el1 ; el3
	el2.zIndex(-1); // New order : el1 ; el3 ; el2
	console.log(el3.zIndex()); // return "1"
	
	el1.zIndex(el2); // New order : el3 ; el2 ; el1

@return {Integer|CanvasEngine.Element}
*/
		zIndex: function(index) {
			var l;
			if (index === undefined) {
				return this._index;
			}
			if (index instanceof Class) {
				index = index.zIndex();
			}
			l = this.parent._children.length;
			if (Math.abs(index) >= l) {
				index = -1;
			}
			if (index < 0) {
				index = l + index;	
			}
			_CanvasEngine.moveArray(this.parent._children, this._index, index);
			this._index = index;
			this._stageRefresh();
			return this;
		},
		
/**
@doc manipulate/
@method zIndexBefore Place this element before another element
@param {Element} element
@return {CanvasEngine.Element}
*/
		zIndexBefore: function(el) {
			this.zIndex(el.zIndex()-1);
			return this;
		},
		
/**
@doc manipulate/
@method remove Removes element in stage
@return {Boolean} "true" if removed
@example

	var foo = this.createElement(),
		bar = this.createElement();
		
	foo.append(bar);
	stage.append(foo);
	foo.remove();
	// stage is empty

*/
		remove: function() {
			var child;
			for (var i=0 ; i < this.parent._children.length ; i++) {
				child = this.parent._children[i];
				if (this._id == child._id) {
					this.parent._children.splice(i, 1);
					this._stageRefresh();
					return true;
				}
			}
			return false;
		},
/**
@doc manipulate/
@method emtpy Removes the element's children
@return {Element}
@example

	var foo = this.createElement(),
		bar = this.createElement();
		
	foo.append(bar);
	stage.append(foo);
	foo.empty();
	// "bar" no longer exists

*/
		empty: function() {
			this._children = [];
			//this.stage.refresh();
			return this;
		},
		/**
			@doc manipulate/
			@method attr Get the value of an attribute for the element
			@param  {String} name
			@return {Object}
		*/
		/**
			@method attr Set the value of an attribute for the element
			@param  {String} name
			@param  {Object} value
			@return {CanvasEngine.Element}
		*/
		attr: function(name, value) {
			if (value === undefined) {
				return this._attr[name];
			}
			this._attr[name] = value;
			return this;
		},
		
		/**
			@doc manipulate/
			@method removeAttr Removes an attribute
			@param  {String} name
			@return {CanvasEngine.Element}
		*/
		removeAttr: function(name) {
			if (this._attr[name]) delete this._attr[name];
			return this;
		},
		
/**
@doc manipulate/
@method offset Relative positions of the parent. Returns an object with `left` and `top` properties
@return {Object}
@example

In method ready

	var el = this.createElement();
		el2 = this.createElement();
		
	el1.x = 50;
	el2.x = 100
		
	el1.append(el2);
	stage.append(el2);
		
	console.log(el2.offset()); // {left: 100, top: 0}

*/
		offset: function() {
			return {
				left: this.x,
				top: this.y
			};
		},

/**
@doc manipulate/
@method position Absolute positions. Returns an object with `left` and `top` properties
@return {Object}
@example

In method ready

	var el = this.createElement();
		el2 = this.createElement();
		
	el1.x = 50;
	el2.x = 100
		
	el1.append(el2);
	stage.append(el2);
		
	console.log(el2.position()); // {left: 150, top: 0}

*/
		position: function() {
			return {
				left: this.real_x,
				top: this.real_y
			};
		},
		/**
			@doc manipulate/
			@method scaleTo Resizes the width and height. Equivalent to scaleX=val and scaleY=val
			@params {Integer} val Value of 1 represents 100%.
			@return {Element}
		*/
		scaleTo: function(val) {
			this.scaleX = val;
			this.scaleY = val;
			this.stage.refresh();
			return this;
		},
		/*
			TODO
		*/
		css: function(prop, val) {
			var obj = {};
			var match;
			if (typeof prop == "string") {
				obj[prop] = val;
			}
			else {
				obj = prop;
			}
			if (obj.left) this.x = parseInt(obj.left);
			if (obj.top) this.y = parseInt(obj.top);
			if (obj['box-shadow']) {
				match = /^([0-9]+)(px)? ([0-9]+)(px)? ([0-9]+)(px)? (#[0-9a-fA-F]{6})$/.exec(obj['box-shadow']);
				if (match) {
					this.shadowColor = match[7];
					this.shadowBlur = match[5];
					this.shadowOffsetX = match[1];
					this.shadowOffsetY = match[3];
				}
			}
			if (obj['linear-gradient']) {
				match = /^\(([a-z ]+),[ ]*(.+)\)$/.exec(obj['linear-gradient']);
				if (match) {
					var pos = match[1];
					var gradients = match[2].split(",");
					this.createLinearGradient(0, 0, 0, 0);
					for (var i=0 ; i < gradients.length ; i++) {
						match = /^(#[0-9a-fA-F]{6})[ ]+([0-9]{1,3})%$/.exec(gradients[i]);
						if (match) this.addColorStop(match[2]/100, match[1]);
					}
				}
			}
			if (obj.opacity) this.opacity = obj.opacity;
			this.stage.refresh();
			return this;
		},
		/**
			@doc manipulate/
			@method hide hide element and refresh the stage
		*/
		hide: function() {
			this._visible = false;
		},
		/**
			@doc manipulate/
			@method show hide element and refresh the stage
		*/
		show: function() {
			this._visible = true;
		},
		/**
			@doc manipulate/
			@method toggle Hide the element if visible or shown if hidden
		*/
		toggle: function() {
			if (this._visible) {
				this.hide();
			}
			else {
				this.show();
			}
		},
/**
@doc events/
@method on The .on() method attaches event handlers to the currently selected set of elements in the CanvasEngine object. 
Note that some names are defined as follows: "namespace:eventname". For example, there are the following event in CanvasEngine:

	stage.on("canvas:refresh", function(el) { // stage is defined in the scene
		console.log(el);
	});

At each refresh of the scene, to display each element is returned
@param {String} events One or more space-separated event types and optional namespaces, such as "click" or "mouseover"
@param {Function} callback(event) A function to execute when the event is triggered
*/
		bind: function(event, callback) { this.on(event, callback); },
		on: function(events, callback) {
			var event;
			events = events.split(" ");
			for (var i=0 ; i < events.length ; i++) {
				event = events[i];
				if (event == "click") event = "tap";
				if (!this._listener[event]) {
					this._listener[event] = [];
				}
				this._listener[event].push(callback);
			}
		},
		
/**
@doc events/
@method off The off() method removes event handlers that were attached with .on()
@param {String} events One or more space-separated event types and optional namespaces, such as "click" or "mouseover"
@param {Function} callback (optional) function which was attached in this event
*/
		unbind: function(events, callback) { this.off(events, callback); },
		off: function(events, callback) {
			var event;
			events = events.split(" ");
			for (var i=0 ; i < events.length ; i++) {
				event = events[i];
				if (callback) {
					for (var i=0 ; i < this._listener[event].length ; i++) {
						if (this._listener[event][i] == callback) {
							delete this._listener[event][i];
							break;
						}
					}
				}
				else {
					if (this._listener[event]) {
						this._listener[event] = [];
					}
				}
			}
		},
		
		/**
			@doc events/
			@method eventExist Test whether an event is present on the element. Return true if exist
			@param {String} event event name ("click" per example)
			@param {Boolean}
		*/
		eventExist: function(event) {
			return this._listener[event] && this._listener[event].length > 0;
		},
		
		/**
			@doc events/
			@method hasEvent If the test element at least one event
			@param {Boolean}
		*/
		hasEvent: function() {
			return _CanvasEngine.objectSize(this._listener) > 0;
		},
		
		/**
			@doc events/
			@method trigger Any event handlers attached with .on() or one of its shortcut methods are triggered when the corresponding event occurs. They can be fired manually, however, with the .trigger() method.
			@param {String} events One or more space-separated event types and optional namespaces, such as "click" or "mouseover"
			@param {Object|Array} params Params
		*/
		trigger: function(events, e) {
			var event, _trigger = false;;
			events = events.split(" ");
			if (!(e instanceof Array)) {
				e = [e];
			}
			for (var j=0 ; j < events.length ; j++) {
				event = events[j];
				if (this._listener[event]) {
					for (var i=0 ; i < this._listener[event].length ; i++) {
						 _trigger = true;
						if (this._listener[event][i]) this._listener[event][i].apply(this, e);
					}
				}
			}
			return _trigger;
		},
		/**
			@doc events/
			@method click Equivalent to the method .on("click", function)
			@params {Function} callback
		*/
		click: function(callback) {
			this.on("click", callback);
		},
		/**
			@doc events/
			@method dblclick Equivalent to the method .on("dblclick", function)
			@params {Function} callback
		*/
		dblclick: function(callback) {
			this.on("dblclick", callback);
		},
		/**
			@doc events/
			@method mouseover Equivalent to the method .on("mouseover", function)
			@params {Function} callback
		*/
		mouseover: function(callback) {
			this.on("mouseover", callback);
		},
		/**
			@doc events/
			@method mouseout Equivalent to the method .on("mouseout", function)
			@params {Function} callback
		*/
		mouseout: function(callback) {
			this.on("mouseout", callback);
		},
		_loop: function() {
			/*for (var i=0 ; i < this._loop_listener.length ; i++) {
				this._loop_listener[i].call(this);
			}*/
			this.trigger("canvas:render");
		},
/**
@doc events/
@method addLoopListener Adds a function that executes the loop for rendering the element
@param {Function} callback() Callback
@example
In the method "ready" in the scene class :

	var el = this.createElement();
	el.addLoopListener(function() {
		this.x += 3;
	});

or 

	var el = this.createElement();
	el.on("canvas:render", (function() {
		this.x += 3;
	});

*/
		addLoopListener: function(callback) {
			this.on("canvas:render", callback);
		}
	}).extend("Context");
	
	Global_CE = CanvasEngine = Class["new"]("CanvasEngineClass");
	return CanvasEngine;
}

CanvasEngine.Core = CanvasEngine;
CanvasEngine.Class = Class;

var CE = CanvasEngine;

/*
 * Hammer.JS
 * version 0.6.4
 * author: Eight Media
 * https://github.com/EightMedia/hammer.js
 * Licensed under the MIT license.
 */
function Hammer(element, options, undefined)
{
    var self = this;

    var defaults = mergeObject({
        // prevent the default event or not... might be buggy when false
        prevent_default    : false,
        css_hacks          : true,

        swipe              : true,
        swipe_time         : 500,   // ms
        swipe_min_distance : 20,   // pixels

        drag               : true,
        drag_vertical      : true,
        drag_horizontal    : true,
        // minimum distance before the drag event starts
        drag_min_distance  : 20,    // pixels

        // pinch zoom and rotation
        transform          : true,
        scale_treshold     : 0.1,
        rotation_treshold  : 15,    // degrees

        tap                : true,
        tap_double         : true,
        tap_max_interval   : 300,
        tap_max_distance   : 10,
        tap_double_distance: 20,

        hold               : true,
        hold_timeout       : 500,

        allow_touch_and_mouse   : false
    }, Hammer.defaults || {});
    options = mergeObject(defaults, options);

    // some css hacks
    (function() {
        if(!options.css_hacks) {
            return false;
        }

        var vendors = ['webkit','moz','ms','o',''];
        var css_props = {
            "userSelect": "none",
            "touchCallout": "none",
            "touchAction": "none",
            "userDrag": "none",
            "tapHighlightColor": "rgba(0,0,0,0)"
        };

        var prop = '';
        for(var i = 0; i < vendors.length; i++) {
            for(var p in css_props) {
                prop = p;
                if(vendors[i]) {
                    prop = vendors[i] + prop.substring(0, 1).toUpperCase() + prop.substring(1);
                }
                element.style[ prop ] = css_props[p];
            }
        }
    })();

    // holds the distance that has been moved
    var _distance = 0;

    // holds the exact angle that has been moved
    var _angle = 0;

    // holds the direction that has been moved
    var _direction = 0;

    // holds position movement for sliding
    var _pos = { };

    // how many fingers are on the screen
    var _fingers = 0;

    var _first = false;

    var _gesture = null;
    var _prev_gesture = null;

    var _touch_start_time = null;
    var _prev_tap_pos = {x: 0, y: 0};
    var _prev_tap_end_time = null;

    var _hold_timer = null;

    var _offset = {};

    // keep track of the mouse status
    var _mousedown = false;

    var _event_start;
    var _event_move;
    var _event_end;

    var _has_touch = ('ontouchstart' in window);

    var _can_tap = false;


    /**
     * option setter/getter
     * @param   string  key
     * @param   mixed   value
     * @return  mixed   value
     */
    this.option = function(key, val) {
        if(val !== undefined) {
            options[key] = val;
        }

        return options[key];
    };


    /**
     * angle to direction define
     * @param  float    angle
     * @return string   direction
     */
    this.getDirectionFromAngle = function( angle ) {
        var directions = {
            down: angle >= 45 && angle < 135, //90
            left: angle >= 135 || angle <= -135, //180
            up: angle < -45 && angle > -135, //270
            right: angle >= -45 && angle <= 45 //0
        };

        var direction, key;
        for(key in directions){
            if(directions[key]){
                direction = key;
                break;
            }
        }
        return direction;
    };


    /**
     * destroy events
     * @return  void
     */
    this.destroy = function() {
        if(_has_touch || options.allow_touch_and_mouse) {
            removeEvent(element, "touchstart touchmove touchend touchcancel", handleEvents);
        }

        // for non-touch
        if (!_has_touch || options.allow_touch_and_mouse) {
            removeEvent(element, "mouseup mousedown mousemove", handleEvents);
            removeEvent(element, "mouseout", handleMouseOut);
        }
    };


    /**
     * count the number of fingers in the event
     * when no fingers are detected, one finger is returned (mouse pointer)
     * @param  event
     * @return int  fingers
     */
    function countFingers( event )
    {
        // there is a bug on android (until v4?) that touches is always 1,
        // so no multitouch is supported, e.g. no, zoom and rotation...
        return event.touches ? event.touches.length : 1;
    }

    /**
     * Gets the event xy positions from a mouse event.
     * @param event
     * @return {Array}
     */
    function getXYMouse(event) {
        var doc = document,
            body = doc.body;

        return [{
            x: event.pageX || event.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && doc.clientLeft || 0 ),
            y: event.pageY || event.clientY + ( doc && doc.scrollTop || body && body.scrollTop || 0 ) - ( doc && doc.clientTop || body && doc.clientTop || 0 )
        }];
    }

    /**
     * gets the event xy positions from touch event.
     * @param event
     * @return {Array}
     */
    function getXYTouch(event) {
        var pos = [], src;
        for(var t=0, len = options.two_touch_max ? Math.min(2, event.touches.length) : event.touches.length; t<len; t++) {
            src = event.touches[t];
            pos.push({ x: src.pageX, y: src.pageY });
        }
        return pos;
    }

    /**
     * get the x and y positions from the event object
     * @param  event
     * @return array  [{ x: int, y: int }]
     */
    function getXYfromEvent(event)
    {
        var _fn = getXYMouse;
        event = event || window.event;

        // no touches, use the event pageX and pageY
        if (!_has_touch) {
            if (options.allow_touch_and_mouse &&
                event.touches !== undefined && event.touches.length > 0) {

                _fn = getXYTouch;
            }
        } else {
            _fn = getXYTouch;
        }

        return _fn(event);
    }


    /**
     * calculate the angle between two points
     * @param   object  pos1 { x: int, y: int }
     * @param   object  pos2 { x: int, y: int }
     */
    function getAngle( pos1, pos2 )
    {
        return Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x) * 180 / Math.PI;
    }

    /**
     * calculate the distance between two points
     * @param   object  pos1 { x: int, y: int }
     * @param   object  pos2 { x: int, y: int }
     */
    function getDistance( pos1, pos2 )
    {
        var x = pos2.x - pos1.x, y = pos2.y - pos1.y;
        return Math.sqrt((x * x) + (y * y));
    }


    /**
     * calculate the scale size between two fingers
     * @param   object  pos_start
     * @param   object  pos_move
     * @return  float   scale
     */
    function calculateScale(pos_start, pos_move)
    {
        if(pos_start.length == 2 && pos_move.length == 2) {
            var start_distance = getDistance(pos_start[0], pos_start[1]);
            var end_distance = getDistance(pos_move[0], pos_move[1]);
            return end_distance / start_distance;
        }

        return 0;
    }


    /**
     * calculate the rotation degrees between two fingers
     * @param   object  pos_start
     * @param   object  pos_move
     * @return  float   rotation
     */
    function calculateRotation(pos_start, pos_move)
    {
        if(pos_start.length == 2 && pos_move.length == 2) {
            var start_rotation = getAngle(pos_start[1], pos_start[0]);
            var end_rotation = getAngle(pos_move[1], pos_move[0]);
            return end_rotation - start_rotation;
        }

        return 0;
    }


    /**
     * trigger an event/callback by name with params
     * @param string name
     * @param array  params
     */
    function triggerEvent( eventName, params )
    {
        // return touches object
        params.touches = getXYfromEvent(params.originalEvent);
        params.type = eventName;

        // trigger callback
        if(isFunction(self["on"+ eventName])) {
            self["on"+ eventName].call(self, params);
        }
    }


    /**
     * cancel event
     * @param   object  event
     * @return  void
     */

    function cancelEvent(event)
    {
        event = event || window.event;
        if(event.preventDefault){
            event.preventDefault();
            event.stopPropagation();
        }else{
            event.returnValue = false;
            event.cancelBubble = true;
        }
    }


    /**
     * reset the internal vars to the start values
     */
    function reset()
    {
        _pos = {};
        _first = false;
        _fingers = 0;
        _distance = 0;
        _angle = 0;
        _gesture = null;
    }


    var gestures = {
        // hold gesture
        // fired on touchstart
        hold : function(event)
        {
            // only when one finger is on the screen
            if(options.hold) {
                _gesture = 'hold';
                clearTimeout(_hold_timer);

                _hold_timer = setTimeout(function() {
                    if(_gesture == 'hold') {
                        triggerEvent("hold", {
                            originalEvent   : event,
                            position        : _pos.start
                        });
                    }
                }, options.hold_timeout);
            }
        },

        // swipe gesture
        // fired on touchend
        swipe : function(event)
        {
            if (!_pos.move || _gesture === "transform") {
                return;
            }

            // get the distance we moved
            var _distance_x = _pos.move[0].x - _pos.start[0].x;
            var _distance_y = _pos.move[0].y - _pos.start[0].y;
            _distance = Math.sqrt(_distance_x*_distance_x + _distance_y*_distance_y);

            // compare the kind of gesture by time
            var now = new Date().getTime();
            var touch_time = now - _touch_start_time;

            if(options.swipe && (options.swipe_time >= touch_time) && (_distance >= options.swipe_min_distance)) {
                // calculate the angle
                _angle = getAngle(_pos.start[0], _pos.move[0]);
                _direction = self.getDirectionFromAngle(_angle);

                _gesture = 'swipe';

                var position = { x: _pos.move[0].x - _offset.left,
                    y: _pos.move[0].y - _offset.top };

                var event_obj = {
                    originalEvent   : event,
                    position        : position,
                    direction       : _direction,
                    distance        : _distance,
                    distanceX       : _distance_x,
                    distanceY       : _distance_y,
                    angle           : _angle
                };

                // normal slide event
                triggerEvent("swipe", event_obj);
            }
        },


        // drag gesture
        // fired on mousemove
        drag : function(event)
        {
            // get the distance we moved
            var _distance_x = _pos.move[0].x - _pos.start[0].x;
            var _distance_y = _pos.move[0].y - _pos.start[0].y;
            _distance = Math.sqrt(_distance_x * _distance_x + _distance_y * _distance_y);

            // drag
            // minimal movement required
            if(options.drag && (_distance > options.drag_min_distance) || _gesture == 'drag') {
                // calculate the angle
                _angle = getAngle(_pos.start[0], _pos.move[0]);
                _direction = self.getDirectionFromAngle(_angle);

                // check the movement and stop if we go in the wrong direction
                var is_vertical = (_direction == 'up' || _direction == 'down');

                if(((is_vertical && !options.drag_vertical) || (!is_vertical && !options.drag_horizontal)) && (_distance > options.drag_min_distance)) {
                    return;
                }

                _gesture = 'drag';

                var position = { x: _pos.move[0].x - _offset.left,
                    y: _pos.move[0].y - _offset.top };

                var event_obj = {
                    originalEvent   : event,
                    position        : position,
                    direction       : _direction,
                    distance        : _distance,
                    distanceX       : _distance_x,
                    distanceY       : _distance_y,
                    angle           : _angle
                };

                // on the first time trigger the start event
                if(_first) {
                    triggerEvent("dragstart", event_obj);

                    _first = false;
                }

                // normal slide event
                triggerEvent("drag", event_obj);

                cancelEvent(event);
            }
        },


        // transform gesture
        // fired on touchmove
        transform : function(event)
        {
            if(options.transform) {
                var count = countFingers(event);
                if (count !== 2) {
                    return false;
                }

                var rotation = calculateRotation(_pos.start, _pos.move);
                var scale = calculateScale(_pos.start, _pos.move);

                if (_gesture === 'transform' ||
                    Math.abs(1 - scale) > options.scale_treshold ||
                    Math.abs(rotation) > options.rotation_treshold) {

                    _gesture = 'transform';
                    _pos.center = {
                        x: ((_pos.move[0].x + _pos.move[1].x) / 2) - _offset.left,
                        y: ((_pos.move[0].y + _pos.move[1].y) / 2) - _offset.top
                    };

                    if(_first)
                        _pos.startCenter = _pos.center;

                    var _distance_x = _pos.center.x - _pos.startCenter.x;
                    var _distance_y = _pos.center.y - _pos.startCenter.y;
                    _distance = Math.sqrt(_distance_x*_distance_x + _distance_y*_distance_y);

                    var event_obj = {
                        originalEvent   : event,
                        position        : _pos.center,
                        scale           : scale,
                        rotation        : rotation,
                        distance        : _distance,
                        distanceX       : _distance_x,
                        distanceY       : _distance_y
                    };

                    // on the first time trigger the start event
                    if (_first) {
                        triggerEvent("transformstart", event_obj);
                        _first = false;
                    }

                    triggerEvent("transform", event_obj);

                    cancelEvent(event);

                    return true;
                }
            }

            return false;
        },


        // tap and double tap gesture
        // fired on touchend
        tap : function(event)
        {
            // compare the kind of gesture by time
            var now = new Date().getTime();
            var touch_time = now - _touch_start_time;

            // dont fire when hold is fired
            if(options.hold && !(options.hold && options.hold_timeout > touch_time)) {
                return;
            }

            // when previous event was tap and the tap was max_interval ms ago
            var is_double_tap = (function(){
                if (_prev_tap_pos &&
                    options.tap_double &&
                    _prev_gesture == 'tap' &&
                    _pos.start &&
                    (_touch_start_time - _prev_tap_end_time) < options.tap_max_interval)
                {
                    var x_distance = Math.abs(_prev_tap_pos[0].x - _pos.start[0].x);
                    var y_distance = Math.abs(_prev_tap_pos[0].y - _pos.start[0].y);
                    return (_prev_tap_pos && _pos.start && Math.max(x_distance, y_distance) < options.tap_double_distance);
                }
                return false;
            })();

            if(is_double_tap) {
                _gesture = 'double_tap';
                _prev_tap_end_time = null;

                triggerEvent("doubletap", {
                    originalEvent   : event,
                    position        : _pos.start
                });
                cancelEvent(event);
            }

            // single tap is single touch
            else {
                var x_distance = (_pos.move) ? Math.abs(_pos.move[0].x - _pos.start[0].x) : 0;
                var y_distance =  (_pos.move) ? Math.abs(_pos.move[0].y - _pos.start[0].y) : 0;
                _distance = Math.max(x_distance, y_distance);

                if(_distance < options.tap_max_distance) {
                    _gesture = 'tap';
                    _prev_tap_end_time = now;
                    _prev_tap_pos = _pos.start;

                    if(options.tap) {
                        triggerEvent("tap", {
                            originalEvent   : event,
                            position        : _pos.start
                        });
                        cancelEvent(event);
                    }
                }
            }
        }
    };


    function handleEvents(event)
    {
        var count;
        switch(event.type)
        {
            case 'mousedown':
            case 'touchstart':
                count = countFingers(event);
                _can_tap = count === 1;

                //We were dragging and now we are zooming.
                if (count === 2 && _gesture === "drag") {

                    //The user needs to have the dragend to be fired to ensure that
                    //there is proper cleanup from the drag and move onto transforming.
                    triggerEvent("dragend", {
                        originalEvent   : event,
                        direction       : _direction,
                        distance        : _distance,
                        angle           : _angle
                    });
                }
                _setup();

                if(options.prevent_default) {
                    cancelEvent(event);
                }
                break;

            case 'mousemove':
            case 'touchmove':
                count = countFingers(event);

                //The user has gone from transforming to dragging.  The
                //user needs to have the proper cleanup of the state and
                //setup with the new "start" points.
                if (!_mousedown && count === 1) {
                    return false;
                } else if (!_mousedown && count === 2) {
                    _can_tap = false;

                    reset();
                    _setup();
                }

                _event_move = event;
                _pos.move = getXYfromEvent(event);

                if(!gestures.transform(event)) {
                    gestures.drag(event);
                }
                break;

            case 'mouseup':
            case 'mouseout':
            case 'touchcancel':
            case 'touchend':
                var callReset = true;

                _mousedown = false;
                _event_end = event;

                // swipe gesture
                gestures.swipe(event);

                // drag gesture
                // dragstart is triggered, so dragend is possible
                if(_gesture == 'drag') {
                    triggerEvent("dragend", {
                        originalEvent   : event,
                        direction       : _direction,
                        distance        : _distance,
                        angle           : _angle
                    });
                }

                // transform
                // transformstart is triggered, so transformed is possible
                else if(_gesture == 'transform') {
                    // define the transform distance
                    var _distance_x = _pos.center.x - _pos.startCenter.x;
                    var _distance_y = _pos.center.y - _pos.startCenter.y;
                    
                    triggerEvent("transformend", {
                        originalEvent   : event,
                        position        : _pos.center,
                        scale           : calculateScale(_pos.start, _pos.move),
                        rotation        : calculateRotation(_pos.start, _pos.move),
                        distance        : _distance,
                        distanceX       : _distance_x,
                        distanceY       : _distance_y
                    });

                    //If the user goes from transformation to drag there needs to be a
                    //state reset so that way a dragstart/drag/dragend will be properly
                    //fired.
                    if (countFingers(event) === 1) {
                        reset();
                        _setup();
                        callReset = false;
                    }
                } else if (_can_tap) {
                    gestures.tap(_event_start);
                }

                _prev_gesture = _gesture;

                // trigger release event
                // "release" by default doesn't return the co-ords where your
                // finger was released. "position" will return "the last touched co-ords"

                triggerEvent("release", {
                    originalEvent   : event,
                    gesture         : _gesture,
                    position        : _pos.move || _pos.start
                });

                // reset vars if this was not a transform->drag touch end operation.
                if (callReset) {
                    reset();
                }
                break;
        } // end switch

        /**
         * Performs a blank setup.
         * @private
         */
        function _setup() {
            _pos.start = getXYfromEvent(event);
            _touch_start_time = new Date().getTime();
            _fingers = countFingers(event);
            _first = true;
            _event_start = event;

            // borrowed from jquery offset https://github.com/jquery/jquery/blob/master/src/offset.js
            var box = element.getBoundingClientRect();
            var clientTop  = element.clientTop  || document.body.clientTop  || 0;
            var clientLeft = element.clientLeft || document.body.clientLeft || 0;
            var scrollTop  = window.pageYOffset || element.scrollTop  || document.body.scrollTop;
            var scrollLeft = window.pageXOffset || element.scrollLeft || document.body.scrollLeft;

            _offset = {
                top: box.top + scrollTop - clientTop,
                left: box.left + scrollLeft - clientLeft
            };

            _mousedown = true;

            // hold gesture
            gestures.hold(event);
        }
    }


    function handleMouseOut(event) {
        if(!isInsideHammer(element, event.relatedTarget)) {
            handleEvents(event);
        }
    }


    // bind events for touch devices
    // except for windows phone 7.5, it doesnt support touch events..!
    if(_has_touch || options.allow_touch_and_mouse) {
        addEvent(element, "touchstart touchmove touchend touchcancel", handleEvents);
    }

    // for non-touch
    if (!_has_touch || options.allow_touch_and_mouse) {
        addEvent(element, "mouseup mousedown mousemove", handleEvents);
        addEvent(element, "mouseout", handleMouseOut);
    }


    /**
     * find if element is (inside) given parent element
     * @param   object  element
     * @param   object  parent
     * @return  bool    inside
     */
    function isInsideHammer(parent, child) {
        // get related target for IE
        if(!child && window.event && window.event.toElement){
            child = window.event.toElement;
        }

        if(parent === child){
            return true;
        }

        // loop over parentNodes of child until we find hammer element
        if(child){
            var node = child.parentNode;
            while(node !== null){
                if(node === parent){
                    return true;
                }
                node = node.parentNode;
            }
        }
        return false;
    }


    /**
     * merge 2 objects into a new object
     * @param   object  obj1
     * @param   object  obj2
     * @return  object  merged object
     */
    function mergeObject(obj1, obj2) {
        var output = {};

        if(!obj2) {
            return obj1;
        }

        for (var prop in obj1) {
            if (prop in obj2) {
                output[prop] = obj2[prop];
            } else {
                output[prop] = obj1[prop];
            }
        }
        return output;
    }


    /**
     * check if object is a function
     * @param   object  obj
     * @return  bool    is function
     */
    function isFunction( obj ){
        return Object.prototype.toString.call( obj ) == "[object Function]";
    }


    /**
     * attach event
     * @param   node    element
     * @param   string  types
     * @param   object  callback
     */
    function addEvent(element, types, callback) {
        types = types.split(" ");
        for(var t= 0,len=types.length; t<len; t++) {
            if(element.addEventListener){
                element.addEventListener(types[t], callback, false);
            }
            else if(document.attachEvent){
                element.attachEvent("on"+ types[t], callback);
            }
        }
    }


    /**
     * detach event
     * @param   node    element
     * @param   string  types
     * @param   object  callback
     */
    function removeEvent(element, types, callback) {
        types = types.split(" ");
        for(var t= 0,len=types.length; t<len; t++) {
            if(element.removeEventListener){
                element.removeEventListener(types[t], callback, false);
            }
            else if(document.detachEvent){
                element.detachEvent("on"+ types[t], callback);
            }
        }
    }
}
