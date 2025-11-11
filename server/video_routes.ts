import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { storagePut, storageGet } from "./storage";
import { TRPCError } from "@trpc/server";

// Python script ni ishga tushirish uchun helper funksiya
function runPythonScript(scriptName: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      path.join(__dirname, "scripts", scriptName),
      ...args,
    ]);

    let output = "";
    let error = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python script xatosi: ${error}`));
      } else {
        resolve(output);
      }
    });
  });
}

export const videoRouter = router({
  // Video haqida ma'lumot olish
  getVideoInfo: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await runPythonScript("get_video_info.py", [
          input.filePath,
        ]);
        return JSON.parse(result);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Video ma'lumotini olishda xato",
        });
      }
    }),

  // Fonni olib tashlash
  removeBackground: protectedProcedure
    .input(
      z.object({
        inputPath: z.string(),
        outputFileName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tempDir = path.join("/tmp", `user-${ctx.user.id}`);
        await fs.mkdir(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, input.outputFileName);

        await runPythonScript("remove_background.py", [
          input.inputPath,
          outputPath,
        ]);

        // S3 ga yuklash
        const fileData = await fs.readFile(outputPath);
        const { url } = await storagePut(
          `videos/background-removed/${ctx.user.id}/${input.outputFileName}`,
          fileData,
          "image/png"
        );

        // Vaqtinchalik faylni o'chirish
        await fs.unlink(outputPath);

        return { success: true, url };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Fonni olib tashlashda xato",
        });
      }
    }),

  // Videoga effekt qo'shish
  applyEffect: protectedProcedure
    .input(
      z.object({
        inputPath: z.string(),
        effectType: z.enum([
          "blur",
          "grayscale",
          "edge",
          "brightness",
          "rotation",
          "flip",
        ]),
        outputFileName: z.string(),
        params: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tempDir = path.join("/tmp", `user-${ctx.user.id}`);
        await fs.mkdir(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, input.outputFileName);

        const args = [
          input.inputPath,
          input.effectType,
          outputPath,
          JSON.stringify(input.params || {}),
        ];

        await runPythonScript("apply_effect.py", args);

        // S3 ga yuklash
        const fileData = await fs.readFile(outputPath);
        const { url } = await storagePut(
          `videos/effects/${ctx.user.id}/${input.outputFileName}`,
          fileData,
          "video/mp4"
        );

        // Vaqtinchalik faylni o'chirish
        await fs.unlink(outputPath);

        return { success: true, url };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Effektni qo'shishda xato",
        });
      }
    }),

  // Videodan GIF yaratish
  createGIF: protectedProcedure
    .input(
      z.object({
        inputPath: z.string(),
        outputFileName: z.string(),
        fps: z.number().default(10),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tempDir = path.join("/tmp", `user-${ctx.user.id}`);
        await fs.mkdir(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, input.outputFileName);

        const args = [
          input.inputPath,
          outputPath,
          input.fps.toString(),
        ];

        if (input.duration) {
          args.push(input.duration.toString());
        }

        await runPythonScript("create_gif.py", args);

        // S3 ga yuklash
        const fileData = await fs.readFile(outputPath);
        const { url } = await storagePut(
          `videos/gifs/${ctx.user.id}/${input.outputFileName}`,
          fileData,
          "image/gif"
        );

        // Vaqtinchalik faylni o'chirish
        await fs.unlink(outputPath);

        return { success: true, url };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "GIF yaratishda xato",
        });
      }
    }),

  // Videoni eksport qilish
  exportVideo: protectedProcedure
    .input(
      z.object({
        inputPath: z.string(),
        outputFileName: z.string(),
        format: z.enum(["mp4", "webm", "avi"]).default("mp4"),
        quality: z.enum(["low", "medium", "high"]).default("high"),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tempDir = path.join("/tmp", `user-${ctx.user.id}`);
        await fs.mkdir(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, input.outputFileName);

        const args = [
          input.inputPath,
          outputPath,
          input.format,
          input.quality,
        ];

        if (input.width && input.height) {
          args.push(input.width.toString(), input.height.toString());
        }

        await runPythonScript("export_video.py", args);

        // S3 ga yuklash
        const fileData = await fs.readFile(outputPath);
        const mimeType = `video/${input.format === "mp4" ? "mp4" : input.format}`;
        const { url } = await storagePut(
          `videos/exports/${ctx.user.id}/${input.outputFileName}`,
          fileData,
          mimeType
        );

        // Vaqtinchalik faylni o'chirish
        await fs.unlink(outputPath);

        return { success: true, url };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Video eksportda xato",
        });
      }
    }),

  // Animatsiya yaratish
  createAnimation: protectedProcedure
    .input(
      z.object({
        imagePath: z.string(),
        outputFileName: z.string(),
        effectType: z.enum(["zoom", "fade", "rotate"]).default("zoom"),
        duration: z.number().default(2.0),
        fps: z.number().default(30),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tempDir = path.join("/tmp", `user-${ctx.user.id}`);
        await fs.mkdir(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, input.outputFileName);

        const args = [
          input.imagePath,
          outputPath,
          input.effectType,
          input.duration.toString(),
          input.fps.toString(),
        ];

        await runPythonScript("create_animation.py", args);

        // S3 ga yuklash
        const fileData = await fs.readFile(outputPath);
        const { url } = await storagePut(
          `videos/animations/${ctx.user.id}/${input.outputFileName}`,
          fileData,
          "image/gif"
        );

        // Vaqtinchalik faylni o'chirish
        await fs.unlink(outputPath);

        return { success: true, url };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Animatsiya yaratishda xato",
        });
      }
    }),

  // Vatermark qo'shish
  addWatermark: protectedProcedure
    .input(
      z.object({
        videoPath: z.string(),
        watermarkPath: z.string(),
        outputFileName: z.string(),
        position: z
          .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
          .default("bottom-right"),
        opacity: z.number().min(0).max(1).default(0.7),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tempDir = path.join("/tmp", `user-${ctx.user.id}`);
        await fs.mkdir(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, input.outputFileName);

        const args = [
          input.videoPath,
          input.watermarkPath,
          outputPath,
          input.position,
          input.opacity.toString(),
        ];

        await runPythonScript("add_watermark.py", args);

        // S3 ga yuklash
        const fileData = await fs.readFile(outputPath);
        const { url } = await storagePut(
          `videos/watermarked/${ctx.user.id}/${input.outputFileName}`,
          fileData,
          "video/mp4"
        );

        // Vaqtinchalik faylni o'chirish
        await fs.unlink(outputPath);

        return { success: true, url };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Vatermark qo'shishda xato",
        });
      }
    }),

  // Foydalanuvchi loyihalarini saqlash
  saveProject: protectedProcedure
    .input(
      z.object({
        projectName: z.string(),
        projectData: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Loyihani bazaga saqlash (keyinroq amalga oshiriladi)
        return {
          success: true,
          projectId: `project-${Date.now()}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Loyihani saqlashda xato",
        });
      }
    }),

  // Foydalanuvchi loyihalarini yuklash
  loadProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // Loyihani bazadan yuklash (keyinroq amalga oshiriladi)
        return { success: true, projectData: {} };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Loyihani yuklashda xato",
        });
      }
    }),
});
