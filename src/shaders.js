const fragPrefix = `
#version 300 es
precision highp float;
precision highp int;
`;

const srcGradient = `${fragPrefix}
smooth in vec2 uv;
out vec3 color;

void main() {
	if (abs(gl_FragCoord.x - gl_FragCoord.y) < 4.0) {
		color = vec3(3.0);
	} else if (gl_FragCoord.x > gl_FragCoord.y) {
		color = vec3(vec2(0.88, 0.68) + uv * 0.04, 0.0);
	} else {
		color = vec3(vec2(0.38, 0.18) + uv * 0.04, 0.0);
	}
}
`;

const srcSky = `${fragPrefix}
smooth in vec3 uvw;
out vec3 color;

void main() {
	if (mod(gl_FragCoord.x, 4.0) < 1.0 && mod(gl_FragCoord.y, 4.0) < 1.0) {
		color = uvw * 0.5 + 0.5;
	} else {
		color = uvw * 0.05 + 0.1;
	}
}
`;

const srcSkybox = `${fragPrefix}
uniform samplerCube sky;
uniform mat3 rot;
uniform vec3 perspectiveScale;
smooth in vec2 uv;
out vec3 color;

void main() {
	vec3 eyeDir = vec3(uv * 2.0 - 1.0, 1.0) * perspectiveScale;
	color = texture(sky, eyeDir * rot).rgb;
}
`;

const srcFisheye = `${fragPrefix}
uniform sampler2D source;
uniform vec2 p;
uniform vec2 ifov; // = normalize(1.0 / p) * atan(length(1.0 / p))
smooth in vec2 uv;
out vec3 color;

void main() {
	vec2 pos = (uv * 2.0 - 1.0) * ifov;
	float posl = length(pos);
	vec2 samplePos = (pos / posl) * tan(posl) * p;
	color = texture(source, samplePos * 0.5 + 0.5).rgb;
}
`;

const srcLightingAmbient = `${fragPrefix}
uniform sampler2D texMatt;
uniform sampler2D texMaterial;
uniform float ambient;
smooth in vec2 uv;
out vec3 color;

void main() {
	vec4 material = texture(texMaterial, uv); // spec matt col component, spec light col component, roughness, glow
	vec3 matt = texture(texMatt, uv).rgb;
	color = matt * (material.w * (1.0 - ambient) + ambient);
}
`;

const srcLighting = `${fragPrefix}
uniform sampler2D texMatt;
uniform sampler2D texMaterial;
uniform sampler2D texNormal;
uniform sampler2D texDepth;
uniform vec3 perspectiveScale;
uniform vec3 lightPos;
uniform vec3 lightCol;
smooth in vec2 uv;
out vec3 color;

vec3 getWorldPos(vec2 uv) {
	vec3 ndcPos = vec3(uv, texture(texDepth, uv).x) * 2.0 - 1.0;
	return vec3(ndcPos.xy, -1.0) * perspectiveScale / ndcPos.z;
}

void main() {
	vec3 worldPos = getWorldPos(uv);
	vec3 worldNormal = texture(texNormal, uv).xyz * 2.0 - 1.0;
	vec4 material = texture(texMaterial, uv); // spec matt col component, spec light col component, roughness, glow
	vec3 matt = texture(texMatt, uv).rgb;
	vec3 worldLightDir = normalize(lightPos - worldPos);
	float lightIntensity = 1.0 / dot(lightPos - worldPos, lightPos - worldPos);

	float lambert = max(0.0, dot(worldLightDir, worldNormal));
	//color = vec4(matt * (lightCol * lambert * lightIntensity + material.w), 1.0);

	vec3 halfAngle = normalize(worldLightDir - normalize(worldPos));

	// specular: Blinn-Phong
	float specular = pow(dot(worldNormal, halfAngle), 1.0 / material.z);

	color = (matt * lambert + (matt * material.x + material.y) * specular) * lightCol * lightIntensity;
}
`;

const srcBloomThresh = `${fragPrefix}
uniform float threshLow;
uniform float threshHigh;
uniform sampler2D source;
smooth in vec2 uv;
out vec3 color;

void main() {
	color = smoothstep(threshLow, threshHigh, texture(source, uv).xyz);
}
`;

const srcBlur = (dir) => `${fragPrefix}
const ivec2 dir = ivec2(${dir});

uniform sampler2D source;
smooth in vec2 uv;
out vec3 color;

void main() {
	color = (
		textureOffset(source, uv, dir * 3).rgb * 0.05 +
		textureOffset(source, uv, -dir * 3).rgb * 0.05 +
		textureOffset(source, uv, dir * 2).rgb * 0.10 +
		textureOffset(source, uv, -dir * 2).rgb * 0.10 +
		textureOffset(source, uv, dir).rgb * 0.20 +
		textureOffset(source, uv, -dir).rgb * 0.20 +
		texture(source, uv).rgb * 0.30
	);
}
`;
const srcBlurX = srcBlur('1, 0');
const srcBlurY = srcBlur('0, 1');

const srcDither = `${fragPrefix}
const float dither = 1.0 / 256.0;
const float bloomStrength = 1.0;

uniform sampler2D source;
uniform sampler2D bloom;
uniform sampler2D noise;
smooth in vec2 uv;
out vec3 color;

void main() {
	color = (
		texture(source, uv).rgb +
		texture(bloom, uv).rgb * bloomStrength +
		texelFetch(noise, ivec2(gl_FragCoord.xy) & 63, 0).rrr * dither
	);
}
`;
