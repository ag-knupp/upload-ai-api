import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from "node:util";
import { prisma } from "../lib/prisma";


// modulos internos do node path, fs, crypto, http, util, stream

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance) {
    app.register(fastifyMultipart, {
        limits: {
            fileSize: 1_048_576 * 25, // Limite de tamanho de arquivo de 1 MB,
        },
    })
    
    app.post("/videos", async (request, reply) => {
        const data = await request.file()

        if(!data) {
            return reply.status(404).send({ error: "Missing file input."})
        }

        const extension = path.extname(data.filename)

        if (extension != ".mp3") {
            return reply.status(404).send({ error: "Invalid input type, please upload a MP3."})
        }

        // example.mp3
        // example

        const fileBaseName = path.basename(data.filename, extension)
        const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`
        const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)

        await pump(data.file, fs.createWriteStream(uploadDestination))

        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: uploadDestination,
            }})

        return {
            video,
        }
      })
}