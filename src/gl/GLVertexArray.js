const bindVertexArray = (gl, object) => gl.bindVertexArray(object);
const getBoundVertexArrayParam = () => WebGL.VERTEX_ARRAY_BINDING;
const deleteVertexArray = (gl, object) => gl.deleteVertexArray(object);

class GLVertexArray extends GLBindable {
	constructor(gl, items, indexBuffer) {
		super(gl, gl.createVertexArray(), bindVertexArray, getBoundVertexArrayParam, deleteVertexArray);

		this.doBound(() => {
			let boundBuffer = null;
			items.forEach(({
				location,
				buffer,
				size,
				type,
				normalize = false,
				stride = 0,
				offset = 0,
				divisor = 0,
			}) => {
				if (buffer) {
					if (buffer !== boundBuffer) {
						gl.bindBuffer(WebGL.ARRAY_BUFFER, buffer.object);
						boundBuffer = buffer;
					}
					gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
					gl.vertexAttribDivisor(location, divisor);
					gl.enableVertexAttribArray(location);
				} else {
					gl.disableVertexAttribArray(location);
					// can be used with gl.vertexAttrib*(), but that is not stored in the VertexArray
				}
			});
			if (boundBuffer) {
				gl.bindBuffer(WebGL.ARRAY_BUFFER, null);
			}
			if (indexBuffer) {
				gl.bindBuffer(WebGL.ELEMENT_ARRAY_BUFFER, indexBuffer.object);
			}
		});
	}
}

Object.assign(WebGL.prototype, {
	createVertexArray(...args) {
		return new GLVertexArray(this.gl, ...args);
	},
});
