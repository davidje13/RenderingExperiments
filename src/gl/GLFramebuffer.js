const FRAMEBUFFER_BINDINGS = {
	[WebGL.DRAW_FRAMEBUFFER]: WebGL.DRAW_FRAMEBUFFER_BINDING,
	[WebGL.READ_FRAMEBUFFER]: WebGL.READ_FRAMEBUFFER_BINDING,
	[WebGL.FRAMEBUFFER]:      WebGL.FRAMEBUFFER_BINDING,
};

const bindFramebuffer = (gl, object, target = WebGL.FRAMEBUFFER) => gl.bindFramebuffer(target, object);
const getBoundFramebufferParam = (target = WebGL.FRAMEBUFFER) => FRAMEBUFFER_BINDINGS[target];
const deleteFramebuffer = (gl, object) => gl.deleteFramebuffer(object);

class GLFramebuffer extends GLBindable {
	constructor(gl, attachments = {}) {
		super(gl, gl.createFramebuffer(), bindFramebuffer, getBoundFramebufferParam, deleteFramebuffer);
		this.setAttachments(attachments);
	}

	setAttachments(attachments) {
		const keys = Object.keys(attachments);
		if (!keys.length) {
			return;
		}

		this.doBound(() => keys.forEach((key) => {
			const attachment = attachments[key];
			if (!attachment) {
				return;
			}
			if (attachment instanceof GLTexture) {
				this.gl.framebufferTexture2D(
					WebGL.FRAMEBUFFER,
					key,
					attachment.target,
					attachment.object,
					0,
				);
			} else if (attachment instanceof GLRenderbuffer) {
				this.gl.framebufferRenderbuffer(
					WebGL.FRAMEBUFFER,
					key,
					WebGL.RENDERBUFFER,
					attachment.object
				);
			} else {
				throw new Error('unknown attachment type for framebuffer');
			}
		}));
	}

	setAttachment(key, attachment) {
		this.setAttachments({ [key]: attachment });
	}
}

Object.assign(WebGL.prototype, {
	createFramebuffer(...args) {
		return new GLFramebuffer(this.gl, ...args);
	},
});
