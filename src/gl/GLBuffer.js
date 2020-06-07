const BUFFER_BINDINGS = {
	[WebGL.ARRAY_BUFFER]:              WebGL.ARRAY_BUFFER_BINDING,
	[WebGL.ELEMENT_ARRAY_BUFFER]:      WebGL.ELEMENT_ARRAY_BUFFER_BINDING,
	[WebGL.COPY_READ_BUFFER]:          WebGL.COPY_READ_BUFFER_BINDING,
	[WebGL.COPY_WRITE_BUFFER]:         WebGL.COPY_WRITE_BUFFER_BINDING,
	[WebGL.TRANSFORM_FEEDBACK_BUFFER]: WebGL.TRANSFORM_FEEDBACK_BUFFER_BINDING,
	[WebGL.UNIFORM_BUFFER]:            WebGL.UNIFORM_BUFFER_BINDING,
	[WebGL.PIXEL_PACK_BUFFER]:         WebGL.PIXEL_PACK_BUFFER_BINDING,
	[WebGL.PIXEL_UNPACK_BUFFER]:       WebGL.PIXEL_UNPACK_BUFFER_BINDING,
};

const bindBuffer = (gl, object, target) => gl.bindBuffer(target, object);
const getBoundBufferParam = (target) => BUFFER_BINDINGS[target];
const deleteBuffer = (gl, object) => gl.deleteBuffer(object);

class GLBuffer extends GLBindable {
	constructor(gl, target, data, usage) {
		super(gl, gl.createBuffer(), bindBuffer, getBoundBufferParam, deleteBuffer);
		this.target = target;
		if (data) {
			this.doBound(() => gl.bufferData(target, data, usage || gl.STATIC_DRAW));
		}
	}
}

Object.assign(WebGL.prototype, {
	createBuffer(...args) {
		return new GLBuffer(this.gl, ...args);
	},
});
