/**
 * WebGL Rendering Utilities
 * 
 * Provides WebGL context creation, shader compilation,
 * and program linking utilities
 */

/**
 * Create and compile a shader
 * 
 * @param gl - WebGL rendering context
 * @param type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
 * @param source - GLSL shader source code
 * @returns Compiled shader
 * @throws Error if compilation fails
 */
export function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create WebGL shader');
  }
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation error: ${log}`);
  }
  
  return shader;
}

/**
 * Create and link a WebGL program
 * 
 * @param gl - WebGL rendering context
 * @param vertexShaderSource - Vertex shader source
 * @param fragmentShaderSource - Fragment shader source
 * @returns Linked WebGL program
 * @throws Error if linking fails
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create WebGL program');
  }
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program linking error: ${log}`);
  }
  
  // Clean up shaders after linking (they're no longer needed)
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  
  return program;
}

/**
 * Get uniform location helper
 * 
 * @param gl - WebGL rendering context
 * @param program - WebGL program
 * @param name - Uniform variable name
 * @returns Uniform location
 */
export function getUniformLocation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string
): WebGLUniformLocation | null {
  return gl.getUniformLocation(program, name);
}

/**
 * Get attribute location helper
 * 
 * @param gl - WebGL rendering context
 * @param program - WebGL program
 * @param name - Attribute variable name
 * @returns Attribute location
 */
export function getAttribLocation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string
): number {
  return gl.getAttribLocation(program, name);
}

/**
 * Create a fullscreen quad buffer
 * 
 * @param gl - WebGL rendering context
 * @returns WebGL buffer with quad vertices
 */
export function createQuadBuffer(gl: WebGLRenderingContext): WebGLBuffer {
  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error('Failed to create quad buffer');
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]),
    gl.STATIC_DRAW
  );
  
  return buffer;
}

/**
 * Create a texture from canvas data
 * 
 * @param gl - WebGL rendering context
 * @param canvas - Source canvas element
 * @returns WebGL texture
 */
export function createTextureFromCanvas(
  gl: WebGLRenderingContext,
  canvas: HTMLCanvasElement
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Failed to create texture');
  }
  
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  return texture;
}

/**
 * Resize canvas to match display size
 * 
 * @param canvas - Canvas element to resize
 * @param maxPixelRatio - Maximum device pixel ratio to use
 * @returns Object with width and height
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  maxPixelRatio: number = 2
): { width: number; height: number } {
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width * Math.min(devicePixelRatio, maxPixelRatio));
  const height = Math.round(rect.height * Math.min(devicePixelRatio, maxPixelRatio));
  
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  
  return { width, height };
}

/**
 * Create a WebGL2 context with fallback to WebGL1
 * 
 * @param canvas - Canvas element
 * @returns WebGL context
 */
export function getWebGLContext(
  canvas: HTMLCanvasElement
): WebGLRenderingContext {
  const options: WebGLContextAttributes = {
    antialias: false,
    alpha: false,
    depth: false,
    preserveDrawingBuffer: false,
  };
  
  // Try WebGL2 first
  let gl: WebGLRenderingContext | null = canvas.getContext('webgl2', options);
  if (gl) return gl;
  
  // Fall back to WebGL1
  gl = canvas.getContext('webgl', options);
  if (!gl) {
    throw new Error('WebGL is not supported');
  }
  
  return gl;
}

/**
 * Setup a canvas with resize observer
 * 
 * @param canvas - Canvas element
 * @param onResize - Callback when canvas is resized
 * @returns Resize observer (call disconnect to stop)
 */
export function setupCanvasResize(
  canvas: HTMLCanvasElement,
  onResize: (width: number, height: number) => void
): ResizeObserver {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = Math.round(entry.contentRect.width * Math.min(devicePixelRatio, 2));
      const height = Math.round(entry.contentRect.height * Math.min(devicePixelRatio, 2));
      onResize(width, height);
    }
  });
  
  resizeObserver.observe(canvas);
  return resizeObserver;
}
