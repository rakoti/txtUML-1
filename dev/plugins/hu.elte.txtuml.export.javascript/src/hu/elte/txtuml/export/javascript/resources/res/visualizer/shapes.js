visualizer.shapes = {};
//A JointJS model for classes extended with size estimation based on name attributes and operations.
//Also supports later resizing
visualizer.shapes.Class = joint.shapes.uml.Class.extend({
		'defaults': joint.util.deepSupplement({
			'type': 'visualizer.shapes.Class',
			'attrs': {				
				'.uml-class-name-text': {
					'font-family': visualizer.Fonts.default.getFamily(),
					'font-size': visualizer.Fonts.default.getSize()
				},
				'.uml-class-attrs-text': {
					'font-family': visualizer.Fonts.default.getFamily(),
					'font-size': visualizer.Fonts.default.getSize()
				},
				'.uml-class-methods-text': {
					'font-family': visualizer.Fonts.default.getFamily(),
					'font-size': visualizer.Fonts.default.getSize()
				}
			}

		}, joint.shapes.uml.Class.prototype.defaults),
		
		'initialize': function() {

			joint.shapes.uml.Class.prototype.initialize.apply(this, arguments);
			this.on({
				'change:size': this.updateRectangles //if size is changed we need to update the SVG rectangles
			});
		},
		
		//runs on every size change and initially for size estimation (modification of original updateRectangles)
		'updateRectangles': function() {
			// if init is false, then we are already have a size and need to provide approximate width and height for the rectangles
			// to fit the new size and avoid scaling issues in IE (or other browser not supporting SVG non-scaling-stroke attribute)
			
			//if init is true, then we also need to estimate a size
			var init = typeof this._init === 'undefined' ? true : this._init;
			var size = null;
			if (!init){
				size = this.get('size');
			}
			
			var font = visualizer.Fonts.default;
			
			var attrs = this.get('attrs');
			
			//SVG rectangles
			var rects = [
				{ type: 'name', text: this.getClassName() },
				{ type: 'attrs', text: this.get('attributes') },
				{ type: 'methods', text: this.get('methods') }
			];

			var offsetY = 0;
			var rectHeight = 0;
			var maxChars = 0;
			//note for this section: the default class implementation for JointJS requires size to be half of the 
			//SVG rectangles it consists
			_.each(rects, function(rect) {
				

				var lines = _.isArray(rect.text) ? rect.text : [rect.text];
				rectHeight = lines.length * font.getContainerHeight(0) + (rect.type == 'name' ? 15 : 10) ;
				//           lines in the rect  *  fontheight          +  padding  
				rectHeight = Math.max(rectHeight * 2, 30); // double the size for rectangles and set empty rectangle height
				
				//get the maximum char count of the lines (note: this assumes monospace font)
				_.each(lines, function(line){
					maxChars = Math.max(maxChars, line.length); 
				})
				
				attrs['.uml-class-' + rect.type + '-text'].text = lines.join('\n');
				attrs['.uml-class-' + rect.type + '-rect'].height = rectHeight;  
				attrs['.uml-class-' + rect.type + '-rect'].transform = 'translate(0,' + offsetY + ')';
				
				offsetY += rectHeight;
			},this);
			
			if (init){
				//first run: set estimated size 
				size = {}; 
				size.height = offsetY * 0.5 + 20;  
				size.width = maxChars * font.getContainerWidth(0) + 5;
				this.set('size',size);
				this._init = false;
			}else{
				//later runs: adjust last rectangle's height to reach total height
				this.attr('.uml-class-methods-rect/height', (size.height - 20) * 2 - (offsetY - rectHeight));  
			}
			
			//set rectangles width
			this.attr('rect/width', size.width * 2);

			
		}
	});
visualizer.shapes.ClassView = joint.shapes.uml.ClassView;
	
//A JointJS model for abstract classes
visualizer.shapes.Abstract = visualizer.shapes.Class.extend({
		'defaults': joint.util.deepSupplement({
			'type': 'visualizer.shapes.Abstract',
			'attrs': {
				'.uml-class-name-rect': { fill : '#e74c3c' },
				'.uml-class-attrs-rect': { fill : '#c0392b' },
				'.uml-class-methods-rect': { fill : '#c0392b' }
			}
		}, visualizer.shapes.Class.prototype.defaults),

		'getClassName': function() {
			return ['<<Abstract>>', this.get('name')]; //add stereotype
		}
	});
visualizer.shapes.AbstractView = visualizer.shapes.ClassView;

// A JointJS model for compositions and associations	
visualizer.shapes.AttributeAssociation = joint.shapes.uml.Association.extend({
	'defaults': joint.util.deepSupplement({
		
		'type': 'visualizer.shapes.AttributeAssociation',
		'attrs':{
			'snapLabels': true //this flag notifies the LinkView that we require snapping
		},
		'sourceName': 'sourceName',
		'sourceNum': 'sourceNum',
		'targetName': 'targetName',
		'targetNum': 'targetNum',
		'name': 'name'
		
	}, joint.shapes.uml.Association.prototype.defaults),
	
	//initializes the modell by setting correct label for the view to snap
	'initialize': function(options){
		var labelTypes = ['sourceName', 'sourceNum', 'targetName', 'targetNum', 'name'];
		
		//positioning info in case of non orthogonal links (user moving vertices)
		var offsets = [-20, 20, 20, -20, 10];
		var distances = [0, 0, 1, 1, 0.5];

		//set up labels
		_.each(labelTypes, function(labelType,key){
			this.label(key, { 
				'position':{  
					'distance': distances[key],
					'offset': offsets[key]
				},
				'attrs':{  
					'text':{  
						'font-family': visualizer.Fonts.links.getFamily(),
						'font-size': visualizer.Fonts.links.getSize(),
						'text': this.attributes[labelType]
					}
				}
			});
		},this);
		
		joint.shapes.uml.Association.prototype.initialize.apply(this, options);
	}
});

// A JointJS model for generalizations 
visualizer.shapes.Generalization = joint.shapes.uml.Generalization.extend({
	'defaults': joint.util.deepSupplement({
		
		'type': 'visualizer.shapes.AttributeAssociation',
		'attrs': { 
			//note markers are flipped (different interpretation)
			'.marker-source': { d:'M 15 0 L 0 7.5 L 15 15 z', fill: 'white'}, 
			'.marker-target': { d:'', fill: 'none'}
			
		}
	}, joint.shapes.uml.Generalization.prototype.defaults)
});

// A JointJS model for transitions 
visualizer.shapes.Transition = joint.shapes.uml.Transition.extend({
	'defaults': joint.util.deepSupplement({
		
		'type': 'visualizer.shapes.Transition',
		'trigger': null
		
	}, joint.shapes.uml.Transition.prototype.defaults),
	
	'initialize': function(options){
		// if trigger is set then create a label for it
		if (this.attributes.trigger){
			this.label(0, { 
					'position':{  
						'distance': 0.5,
						'offset': 10
					},
					'attrs':{  
						'text':{  
							'font-family': visualizer.Fonts.links.getFamily(),
							'font-size': visualizer.Fonts.links.getSize(),
							'text': this.attributes.trigger
						}
					}
				});
		}
		
		joint.shapes.uml.Transition.prototype.initialize.apply(this, options);
	}
});

// A JointJS model for states extended with size estimation based on name attributes and operations.
// Also supports later resizing
visualizer.shapes.State = joint.shapes.uml.State.extend({		
		'defaults': joint.util.deepSupplement({
			'type': 'visualizer.shapes.State',
			'attrs': {
				'.uml-state-name': {
					'fill': '#000000', 'font-family': visualizer.Fonts.default.getFamily(), 
					'font-size': visualizer.Fonts.default.getSize()
				},
				'.uml-state-events': {
					'fill': '#000000', 'font-family': visualizer.Fonts.default.getFamily(), 
					'font-size': visualizer.Fonts.default.getSize()
				}
			}
		},joint.shapes.uml.State.prototype.defaults),
		
		'initialize': function() {

			joint.shapes.uml.State.prototype.initialize.apply(this, arguments);
			this.on({
				'change:size': this.fixBorders //in case of size change we need to correct the SVG rectangles size
			});
			this.autoSize();
		},
		
		//estimate initial size
		'autoSize': function() {
			var font = visualizer.Fonts.default;
			var attrs = this.get('attrs');

			//texts
			var rects = [
				{ type: 'name', text: this.get('name') },
				{ type: 'events', text: this.get('events') }
			];

			var offsetY = 0;
			var rectHeight = 0;
			var maxChars = 0;
			_.each(rects, function(rect) {
				

				var lines = _.isArray(rect.text) ? rect.text : [rect.text];
				//calculate bounding rectangle height
				rectHeight = lines.length * font.getContainerHeight(3);

				//calculate maximum characters
				_.each(lines, function(line){
					maxChars = Math.max(maxChars, line.length);
				})
				
				offsetY += rectHeight;
			});
			
			var minSize = {
				'width' : maxChars * font.getContainerWidth(0) + 35, //calculated size (assumes monospace, provides wide padding)
				'height' : offsetY + 20 
			}
			this.set('size', minSize);
		},
		//runs on size change, sets SVG rectangle size
		'fixBorders': function(){
			var size = this.get('size');
			this.attr('rect/width',size.width);
			this.attr('rect/height',size.height);
		}
		
});

// A JointJS model for initial pseudo states
visualizer.shapes.StartState = joint.shapes.uml.StartState.extend({
	'markup': '<g class="rotatable"><g class="scalable"><circle class="uml-startstate-circle"/></g><rect class="uml-startstate-name-bg" /><text class="uml-startstate-name"/></g>',
    'defaults': joint.util.deepSupplement({

        'type': 'visualizer.shapes.StartState',
		'attrs':{
			'text':{
                'ref': '.uml-startstate-circle', 'ref-x': .5, 'ref-y': .5, 'text-anchor': 'middle',
                'fill': '#000000', 'font-family':visualizer.Fonts.pseudostates.getFamily() , 
				'font-size': visualizer.Fonts.pseudostates.getSize(),
				'text' : ''
			},
			'.uml-startstate-name-bg':{
				'ref': 'text', 'ref-x':-1, 'ref-y':-1,
				'fill':'white',
				'width':1,
				'height':visualizer.Fonts.pseudostates.getContainerHeight(1)
			},
		},
		'size':{
			'width':30,
			'height':30			
		}		

    }, joint.shapes.uml.StartState.prototype.defaults),
	
	'initialize': function(){
		joint.shapes.uml.StartState.prototype.initialize.apply(this, arguments);
		this.updateNameBG();
	},
	
	//updates rectangle behind text to provide background for text
	'updateNameBG': function(){
		var font = visualizer.Fonts.pseudostates;
		var str = this.attr('text/text');
		this.attr('.uml-startstate-name-bg/width', font.getContainerBoxSize(str, 1, 0).width);
	}

});

// A JointJS model for choice pseudo states. Estimates width to fit text
visualizer.shapes.Choice = joint.shapes.basic.Generic.extend({
	'markup': '<g class="rotatable"><g class="scalable"><path class="uml-choice-body"/><path class="uml-choice-fill"/></g><rect class="uml-choice-name-bg" /><text class="uml-choice-name"/></g>',
    'defaults': joint.util.deepSupplement({

        'type': 'visualizer.shapes.Choice',
		'attrs':{
			'.uml-choice-body':{
				'd': 'M 0 100 L 100 0 L 200 100 L 100 200 z',
				'fill':'black'
			},
			'.uml-choice-fill':{
				'd': 'M 4 100 L 100 4 L 196 100 L 100 196 z',
				'fill': 'white'
			},
			'text':{
                'ref': '.uml-choice-body', 'ref-x': .5, 'ref-y': .5,  'text-anchor': 'middle', 'y':'0.4em',
                'fill': '#000000', 'font-family': visualizer.Fonts.pseudostates.getFamily(),
				'font-size': visualizer.Fonts.pseudostates.getSize(),
				'text' : ''
			},
			'.uml-choice-name-bg':{
				'ref': 'text', 'ref-x':-1, 'ref-y':-1,
				'fill':'white',
				'width':1,
				'height':visualizer.Fonts.pseudostates.getContainerHeight(1)
			},
			
		},
		'size':{
			'width':60,
			'height':60
		}
    }, joint.shapes.basic.Generic.prototype.defaults),
	'initialize': function(){
		joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
		this.updateSize();
	},
	
	//Estimates width based on text inside
	'updateSize': function(){
		var str = this.attr('text/text');
		var font = visualizer.Fonts.pseudostates;
		//calculate width
		var width = font.getContainerBoxSize(str, 1, 0).width;
		//set width for background
		this.attr('.uml-choice-name-bg/width', width);
		var oldSize = this.get('size');
		var size = {
			//avoid shrinking bellow default
			'width': Math.max(width + 20, oldSize.width),
			'height': oldSize.width
		}
		//set calculated size
		this.set('size',size);
	}

});
