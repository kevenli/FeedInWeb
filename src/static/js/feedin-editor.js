/* JSON */
JSON.stringify = JSON.stringify || function(obj) {
	var t = typeof (obj);
	if (t != "object" || obj === null) {
		// simple data type
		if (t == "string")
			obj = '"' + obj + '"';
		return String(obj);
	} else {
		// recurse array or object
		var n, v, json = [], arr = (obj && obj.constructor == Array);
		for (n in obj) {
			v = obj[n];
			t = typeof (v);
			if (t == "string")
				v = '"' + v + '"';
			else if (t == "object" && v !== null)
				v = JSON.stringify(v);
			json.push((arr ? "" : '"' + n + '":') + String(v));
		}
		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	}
};

(function($) {
	function ModuleTerminal(module, id, type){
		this.id = id;
		this.ui = $("<div>")
			.addClass("terminal")
			.addClass(type)
			.append($("<span>").addClass("terminalrender ui-icon ui-icon-radio-off"));
		this.ui[0].terminal = this;
		this.module = module;
	}
	
	function Module(){
		this.type = null;
		this.id = null;
		this.terminals = [];
		this.getTerminals = function() {
			return this.terminals;
		};
		
		this.findTerminal = function(id){
			for(terminalIndex in this.terminals){
				if(this.terminals[terminalIndex].id == id){
					return this.terminals[terminalIndex];
				}
			}
		};
	}
	
	function XPathFetchModule() {
		Module.call(this);
		this.type = 'xpathfetchpage';
		this.ui = $("<div>")
				.addClass("module")
				.html(
						"<div>"
								+ "<div class='title ui-widget-header'><span></span>"
								+ "<ul class='buttons'></ul>"
								+ "</div>"
								+ "<div class='content'>"
								+ "<div><span>URL:</span><input name='url' /></div>"
								+ "<div><span>Extract using XPath:<input name='xpath' /></div>"
								+ "<div><span>Use HTML parser</span><input type='checkbox' /></div>"
								+ "<div><span>Emit items as string</span><input type='checkbox' /></div>"
								+ "</div>" + "</div>");

		this.ui.find("div.title>span").text("XPath Fetch Page");
		this.ui.find("ul.buttons").append(
				$("<li>").addClass("minimal ui-icon ui-icon-minus"),
				$("<li>").addClass("remove ui-icon ui-icon-close"));

		this.getConf = function() {
			conf = {};
			urlValue = this.ui.find("input[name='url']").val();
			if (urlValue.startsWith("item.")){
				conf['URL'] = {'subkey': urlValue.substring(5), 'type':'text'}
			}else{
				conf['URL'] = {'value' :urlValue, 'type':'url'};
			}
			
			conf['xpath'] = {'value' :this.ui.find("input[name='xpath']").val(), 'type':'text'};
			return conf;
		}
		
		this.setConf = function(conf){
			if (conf['URL']['value']){
				this.ui.find("input[name='url']").val(conf['URL']['value']);
			}else if(conf['URL']['subkey']){
				this.ui.find("input[name='url']").val("item." + conf['URL']['subkey']);
			}
			
			if(conf['xpath']){
				this.ui.find("input[name='xpath']").val(conf['xpath']['value']);
			}
		}

		this.terminals = [
		                  new ModuleTerminal(this, '_OUTPUT', 'south')
		                  ];

	}
	
	function LoopModule() {
		Module.call(this);
		this.type = 'loop';
		this.subModule = null;
		this.ui = $("<div>")
				.addClass("module")
				.addClass("LoopModule")
				.html(
						"<div>"
								+ "<div class='title ui-widget-header'><span></span>"
								+ "<ul class='buttons'></ul>"
								+ "</div>"
								+ "<div class='content'>"
								+ "<form>"
								+ "<div><span>For each <input name='with' value='item' /> in input</span></div>"
								+ "<div class='submodule empty'></div>"
								+ '<div><input name="mode" type="radio" value="emit">emit <select name="emit_part" style="display: inline;"><option value="all">all</option><option value="first">first</option></select> results</div>'
								+ '<div><input name="mode" type="radio" value="assign">assign <select name="assign_part" style="display: inline;"><option value="all">all</option><option value="first">first</option></select> results to <input name="assign_to" /></div>'
								+ "</form>"
								+ "</div>" + "</div>");

		this.ui.find("div.title>span").text("Loop");
		this.ui.find("ul.buttons").append(
				$("<li>").addClass("minimal ui-icon ui-icon-minus"),
				$("<li>").addClass("remove ui-icon ui-icon-close"));

		this.getConf = function() {
			var conf = {};
			if (this.subModule){
				conf['embed'] = {
						"value" : {
							"type" : this.subModule.type,
							"id" : this.subModule.id,
							"conf" : this.subModule.getConf()
						}
				};
			}
			conf['mode'] = {"type":"text", "value": this.ui.find("input[name=mode]:checked").val()};
			conf['emit_part'] = {"type":"text", "value": this.ui.find("form select[name=emit_part]").val()};
			conf['assign_part'] = {"type":"text", "value": this.ui.find("form select[name=assign_part]").val()};
			conf['assign_to'] = {"type":"text", "value": this.ui.find("form input[name=assign_to]").val()};
			return conf;
		}
		
		this.setConf = function(conf){
			if (conf.embed){
				var submodule = $editor.buildModule(conf.embed.value.type);
				submodule.id = conf.embed.value.id;
				this.subModule = submodule;
				submodule.setConf(conf.embed.value.conf);
				this.ui.find(".submodule").append(submodule.ui).removeClass("empty");
				submodule.ui.find(".remove").click((function(parent, submodule){
					return function(event){
						event.stopPropagation();
						parent.removeSubModule(submodule);
						};
				})(this, submodule));
			}
			
			if(conf['with']){
				if(conf['with']['value'] == ""){
					this.ui.find("form input[name='with']").val("item");
				}
			}
			
			if(conf['mode']){
				this.ui.find("form input[name='mode'][value=" + conf['mode']['value'] + "]").attr("checked", "checked");
			}
			if(conf['emit_part']){
				this.ui.find("form select[name=emit_part]").val(conf['emit_part']['value']);
			}
			if(conf['assign_part']){
				this.ui.find("form select[name=assign_part]").val(conf['assign_part']['value']);
			}
			if(conf['assign_to']){
				this.ui.find("form input[name=assign_to]").val(conf['assign_to']['value']);
			}
		}

		this.terminals = [
		                  new ModuleTerminal(this, '_OUTPUT', 'south'),
		                  new ModuleTerminal(this, '_INPUT', 'north')
		                  ];
		
		this.removeSubModule = function(module){
			module.ui.remove();
			this.ui.find(".submodule").addClass("empty")
		};

	}
	
	function OutputModule(){
		Module.call(this);
		this.id = "_OUTPUT";
		this.type = 'output';

		this.ui = $("<div>")
			.addClass("module")
			.html(
				"<div>"
						+ "<div class='title ui-widget-header'><span></span>"
						+ "<ul class='buttons'></ul>"
						+ "</div>"
						+ "</div>");
		this.ui.find("div.title>span").text("Output");
		
		this.getConf = function(){
			return null;
		};
		
		this.setConf = function(conf){
			
		};
		
		this.terminals = [ 
		                   new ModuleTerminal(this, '_INPUT', 'north')
		                   ];
		
	}
	
	function RenameModule(){
		Module.call(this);
		this.id = null;
		this.type = 'rename';

		this.ui = $("<div>")
			.addClass("module")
			.addClass("RenameModule")
			.html(
				"<div>"
						+ "<div class='title ui-widget-header'><span></span>"
						+ "<ul class='buttons'></ul>"
						+ "</div>"
						+ "<div class='content'>"
						+ "<div><img class='paramadd'></div>"
						+ "<ul class='paramlist' key='RULE'>"
						+ "</ul>"
						+ "</div>"
						+ "</div>");
		this.ui.find("select.op").append("<option value='rename'>Rename</option>");
		this.ui.find("select.op").append("<option value='copy'>Copy</option>");
		this.ui.find("div.title>span").text("Rename");
		this.ui.find("ul.buttons").append(
				$("<li>").addClass("minimal ui-icon ui-icon-minus"),
				$("<li>").addClass("remove ui-icon ui-icon-close"));
		this.ui.find("img.paramadd").click((function(module){
			return function(){
				module.addRule();
			}
		})(this));
		
		this.getConf = function(){
			conf = {"RULE": []};
			
			this.ui.find("ul.paramlist li").each(function(i, e){
				var $e = $(e);
				var rule = {
						"field" : {
							"type" : "text",
							"value" : $e.find("input.field").val()
						},
						"op" : {
							"type" : "text",
							"value" : $e.find("select.op").val()
						},
						"newval":{
							"type": "text",
							"value" : $e.find("input.newval").val()
						}
						
				}
				conf.RULE.push(rule);
			});
			return conf;
		};
		
		this.setConf = function(conf){
			if(conf.RULE){
				for(ruleIndex in conf.RULE){
					this.addRule(conf.RULE[ruleIndex]['field']['value'], 
							conf.RULE[ruleIndex]['op']['value'], 
							conf.RULE[ruleIndex]['newval']['value']);
				}
			}
		};
		
		this.addRule = function(field, op, newval){
			var $options = $("<select>")
				.addClass("op")
				.append($("<option value='rename'>").text("Rename"))
				.append($("<option value='copy'>").text("Copy"))
				.val(op);
			var $delbtn = $("<img>").addClass("paramdel").click(function(e){
				$(this).parents("li").remove();
			});
			$("<li>").append($("<div>")
					.append($delbtn)
					.append($("<input>").addClass("field").val(field))
					.append($options)
					.append($("<input>").addClass("newval").val(newval)))
				.appendTo(this.ui.find("ul.paramlist"));
		};
		
		this.terminals = [ 
		                   new ModuleTerminal(this, '_INPUT', 'north'),
		                   new ModuleTerminal(this, '_OUTPUT', 'south')
		                   ];
	}
	
	function Wire(){
		this._startPoint = {};
		this._endPoint = {};
		this.borderWidth = 5;
		this.canvas = $("<canvas>").addClass("wire");
		this.src = {};
		this.tgt = {};
		this.editiongRegion = null;
		
		this.start = function(editingRegion, module, terminal){
			this.editingRegion = editingRegion;
			startleft = terminal.ui.offset().left - editingRegion.offset().left;
			starttop = terminal.ui.offset().top - editingRegion.offset().top;
			if (terminal.id == '_OUTPUT'){
				this.src['module'] = module;
				this.src['terminal'] = terminal;
			}else if(terminal.id =='_INPUT'){
				this.tgt['module'] = module;
				this.tgt['terminal'] = terminal;
			}
			
			this._startPoint['left']=startleft;
			this._startPoint['top']=starttop;
			this.canvas.css("position", 'absolute');
			// canvas background color, for debug only
			//this.canvas.css("background-color", "white");   
			this.canvas.css("top", starttop - this.borderWidth);
			this.canvas.css("left", startleft - this.borderWidth);
			this.canvas.addClass("wire-current");
		};
		
		this.update = function(left, top){
			this._endPoint['left'] = left;
			this._endPoint['top'] = top;
			newCornor = [this.borderWidth,this.borderWidth];
			startPoint = [0, 0];
			if (this.src.terminal){
				controlPoint1 = [0, 100];
			}else{
				controlPoint1 = [0, -100];
			}
			
			if (this.src && this.src.terminal){
				this._startPoint.left = this.src.terminal.ui.offset().left
					- this.editingRegion.offset().left;
				this._startPoint.top = this.src.terminal.ui.offset().top
					- this.editingRegion.offset().top;
			}
			
			endPoint = [left - this._startPoint.left, top - this._startPoint.top];

			canvas = this.canvas[0];
			canvasWidth = Math.max(startPoint[0], controlPoint1[0], endPoint[0]) - 
				Math.min(startPoint[0], controlPoint1[0], endPoint[0])
				+ this.borderWidth * 2;
			
			canvasHeight = Math.max(startPoint[1], controlPoint1[1], endPoint[1]) 
				- Math.min(startPoint[1], controlPoint1[1], endPoint[1])
				+ this.borderWidth * 2;
			
			canvasOffsetX = Math.min(startPoint[0], controlPoint1[0], endPoint[0]);
			canvasOffsetY = Math.min(startPoint[1], controlPoint1[1], endPoint[1]);
			
			this.canvas.css('top', this._startPoint.top + canvasOffsetY - this.borderWidth);
			this.canvas.css('left', this._startPoint.left + canvasOffsetX - this.borderWidth);
			
			newCornor = [-canvasOffsetX + this.borderWidth, -canvasOffsetY + this.borderWidth];

			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			
			
			var ctx=this.canvas[0].getContext("2d");
			ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
			ctx.translate(newCornor[0], newCornor[1]);
			ctx.lineWidth=2;
			ctx.fillStyle="blue";
			ctx.lineCap="round";
			ctx.shadowColor="blue";
			ctx.shadowBlur = 5;
			
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.quadraticCurveTo(controlPoint1[0], controlPoint1[1],
					endPoint[0], endPoint[1]);
			ctx.stroke();
		};
		
		this.end = function(editingRegion, module, terminal){
			endLeft = terminal.ui.offset().left - editingRegion.offset().left;
			endTop = terminal.ui.offset().top - editingRegion.offset().top;
			this.update(endLeft, endTop);
			if (terminal.id == '_OUTPUT'){
				this.src['module'] = module;
				this.src['terminal'] = terminal;
			}else if(terminal.id =='_INPUT'){
				this.tgt['module'] = module;
				this.tgt['terminal'] = terminal;
			}
			this.canvas.removeClass("wire-current");
		};
	}

	function Editor() {
		this.modules = [];
		this.feedId = null;
		this.wires = [];
		this.init = function(settings) {
			this.settings = settings;
			$editor = this;
			$(".control").draggable({
				appendTo : "body",
				opacity : 0.7,
				helper : "clone",
				cursor : "move"
			});
			
			this.editingRegion = settings['editingRegion'];

			$("#editor").droppable(
					{
						drop : function(event, ui) {
							controlType = ui.draggable.attr("control-type");
							if (controlType) {
								newControl = $editor.buildModule(controlType);
								$editor.addModule(newControl);

								editorPosition = $("#editor").offset();
								newControl.ui.css("top",event.pageY - editorPosition.top - 10)
										.css("left",event.pageX	- editorPosition.left- 30);

								
							}
						}
					});
		};

		this.addModule = function(module) {
			this.modules.push(module);

			if(!module.id){
				module.id = this.generateModuleId();
			}
			
			module.ui.find(".buttons .remove").click(function(event) {
				if (!event.isPropagationStopped()){
					$editor.removeModule(module);
				}
			});
			
			module.ui.addClass("editing_control");
			

			
			module.ui.css("position", "absolute");
			
			moduleTerminals = module.getTerminals();
			for(terminalIndex in moduleTerminals){
				terminal = moduleTerminals[terminalIndex];
				
				terminalPoint = terminal.ui.find(".terminalrender")
				
				terminalPoint.draggable({helper:'clone',
					appendTo : "body",
					start: (function(editor, module, terminal){return function (event, ui){
						editor.startWiring(module, terminal, event, ui);
					}})($editor, module, terminal), 
					stop: (function(editor, module, terminal){return function(event, ui){
						editor.stopWiring(module, terminal, event, ui);
					}})($editor, module, terminal),
					drag:(function(editor, module, terminal){return function(event, ui){
						editor.dragWiring(module, terminal, event, ui);
						}})($editor, module, terminal)
					});
				
				module.ui.append(terminal.ui);
			}
			this.editingRegion.append(module.ui);
			module.ui.draggable({
				cursor : "move",
				scroll : true, 
				drag: function(event, ui){
					$editor.onModuleMove(module, event, ui);
				} 
			});
		};

		this.removeModule = function(module) {
			index = this.modules.indexOf(module);
			if(index > -1){
				this.modules.splice(index, 1);
			}
			module.ui.remove();
			
			for(var i=this.wires.length-1;i>=0;i--){
				var wire = this.wires[i];
				if (wire.tgt.module == module){
					this.removeWire(wire);
				}else if (wire.src.module == module){
					this.removeWire(wire);
				}
			}
		}

		this.buildModule = function(moduleType) {
			var module;
			switch (moduleType) {
			case "xpathfetchpage":
				module = new XPathFetchModule;
				break;
			case "output":
				module = new OutputModule;
				break;
			case "rename":
				module = new RenameModule;
				break;
			case "loop":
				module = new LoopModule;
				break;
			}

			return module;
		};

		this.generateModuleId = function() {
			min = 0;
			max = this.modules.length + 1;
			while (true) {
				newId = 'm' + (Math.floor(Math.random() * (max - min)) + min);
				found = false;
				for (moduleIndex in this.modules) {
					module = this.modules[moduleIndex];
					if (module.id == newId) {
						found = true;
						break;
					}
				}
				if (!found) {
					return newId;
				}
			}

		}

		this.toJson = function() {
			var obj = {
				'feed_id' : this.feedId
			};
			obj['modules'] = [];
			obj['layout'] = [];
			obj['wires'] = [];
			for (i in this.modules) {
				var module = this.modules[i];
				module_config = {
						'type' : module.type,
						'id' : module.id
					}
				conf = module.getConf();
				if (conf){
					module_config['conf'] = conf;
				}
				obj['modules'].push(module_config);
				
				obj['layout'].push({
					'id' : module.id,
					'xy' : [module.ui.position().left, 
					        module.ui.position().top]
				});
			}
			for (wireIndex in this.wires){
				wire = this.wires[wireIndex];
				obj['wires'].push(
					{'src': {'id': wire.src.terminal.id, 
						'moduleid': wire.src.module.id }, 
					'tgt': {'id': wire.tgt.terminal.id, 
						'moduleid': wire.tgt.module.id}}	
				);
			}
			return JSON.stringify(obj);
		}

		this.save = function() {
			$.ajax({
				url : $editor.settings['saveUrl'],
				method : 'post',
				data : {
					'feedinfo' : editor.toJson()
				},
				dataType : 'json',
				error : function() {
					console.log("error");
				},
				success : function(data) {
					console.log("success");
					$editor.feedId = data['feed_id']
				}
			});
		};
		
		this.findModule = function(id){
			for(moduleIndex in this.modules){
				if (this.modules[moduleIndex].id == id){
					return this.modules[moduleIndex];
				}
			}
		};
		
		this._loadFeedData = function(data){
			this.feedId = data['feed_id'];
			for(i=0;i<data['modules'].length;i++){
				moduleInfo = data['modules'][i];
				module = this.buildModule(moduleInfo.type);
				module.id = moduleInfo.id;
				module.setConf(moduleInfo.conf);
				this.addModule(module);
				
				if (data['layout']){
					for(j=0;j<data['layout'].length;j++){
						if (data['layout'][j].id == module.id){
							module.ui.css("left", data['layout'][j].xy[0]);
							module.ui.css("top", data['layout'][j].xy[1]);
							break;
						}
					}
				}
			}
			
			if(data['wires']){
				for(wireIndex in data['wires']){
					wireInfo = data['wires'][wireIndex];
					wire = new Wire();
					sourceModule = this.findModule(wireInfo.src.moduleid);
					sourceTerminal = sourceModule.findTerminal(wireInfo.src.id);
					targetModule = this.findModule(wireInfo.tgt.moduleid);
					targetTerminal = targetModule.findTerminal(wireInfo.tgt.id);
					wire.start(this.editingRegion, sourceModule, sourceTerminal);
					wire.end(this.editingRegion, targetModule, targetTerminal);
					this.addWire(wire);
				}
			}
		}

		this.load = function(id) {
			for(moduleIndex in this.modules){
				this.removeModule(this.modules[moduleIndex]);
			}
			$editor = this;
			$.ajax({
				url : $editor.settings['loadUrl'],
				method : 'get',
				data : {
					'id' : id
				},
				dataType : 'json',
				error : function() {
					console.log("error");
				},
				success : function(data) {
					console.log("success");
					$editor._loadFeedData(data);
				}
			});
		}
		
		this.currentWire = null;
		this.startWiring = function(module, terminal, event, ui){
			console.log("startWiring");
			console.log(module);
			console.log(terminal);
			var wire = new Wire;
			editorPosition = $("#editor").offset();
			sourceControl = ui.helper[0];
			wire.start(this.editingRegion, module, terminal, ui.offset.left - editorPosition.left, ui.offset.top - editorPosition.top);
			
			$editor.currentWire = wire;
			wire.canvas.appendTo($editor.editingRegion);
		};
		
		function getElsAt(root, top, left){
		    return $(root)
		               .find(".terminalrender")
		               .filter(function() {
		                           return $(this).offset().top <= top + 5 
		                           			&& $(this).offset().top + $(this).height() >= top -5
		                                    && $(this).offset().left <= left + 5
		                                    && $(this).offset().left + $(this).width() >= left-5;
		               });
		}
		
		this.dragWiring = function(module, terminal, event, ui){
			console.log("dragWiring");
			editorPosition = $("#editor").offset();
			$editor.currentWire.update(ui.offset.left + ui.helper.width() / 2 - editorPosition.left, 
					ui.offset.top + ui.helper.height() /2 - editorPosition.top);
		};
		
		this.stopWiring = function(module, terminal, event, ui){
			stopPoint = [event.pageX, event.pageY]
			pointElements = getElsAt($editor.editingRegion, event.pageY, event.pageX);
			if (pointElements.length>0){
				terminal = pointElements.parents(".terminal")[0].terminal;
				this.currentWire.end($editor.editingRegion, terminal.module, terminal);
				for(wireIndex in this.wires){
					existingWire = this.wires[wireIndex];
					if (existingWire.tgt.terminal == this.currentWire.tgt.terminal){
						this.removeWire(existingWire);
					}
					if (existingWire.src.terminal == this.currentWire.src.terminal){
						this.removeWire(existingWire);
					}
				}
				this.addWire(this.currentWire);
			}else{
				$editor.currentWire.canvas.remove();
			}
		};
		
		this.addWire = function(wire){
			this.editingRegion.append(wire.canvas);
			this.wires.push(wire);
		};
		
		this.removeWire = function(wire){
			wire.canvas.remove();
			var index = this.wires.indexOf(wire);
			if (index >- 1){
				this.wires.splice(index, 1);
			}
		};
		
		this.onModuleMove = function(module, event, ui){
			for (wireIndex in this.wires){
				wire = this.wires[wireIndex];
				if (wire.src.module == module){
					wire.update(wire.tgt.terminal.ui.offset().left - this.editingRegion.offset().left, 
							wire.tgt.terminal.ui.offset().top - this.editingRegion.offset().top);
					
				}else if(wire.tgt.module == module){
					wire.update(wire.tgt.terminal.ui.offset().left - this.editingRegion.offset().left, 
							wire.tgt.terminal.ui.offset().top - this.editingRegion.offset().top);
				}
			}
		};
		
	}

	$.fn.editor = function(options) {
		var settings = $.extend({
			'saveUrl' : '/feeds/save', 
			'loadUrl' : '/feeds/load'
		}, options);
		settings['editingRegion'] = this;
		$("#div_left_menu").accordion();
		var editor = new Editor;
		editor.init(settings);
		outputModule = editor.buildModule('output');
		editor.addModule(outputModule);
		return editor;
	};
}(jQuery));
