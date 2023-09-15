import { FastifyInstance } from 'fastify'
import { fastifyMultipart } from '@fastify/multipart'
import { prisma } from '../lib/prisma'
import {randomUUID} from 'node:crypto'
import path from 'node:path'
import {pipeline} from 'node:stream'
import fs from 'node:fs'
import { promisify } from 'node:util'

const pump = promisify(pipeline) //aguarda todo o upload do arquivo

//path,fs,crypto,http,util,stream são módulos internos do node.

export async function uploadVideoRoute(app: FastifyInstance){
    
    
    app.register(fastifyMultipart, {
            limits:{
                fileSize: 1_048_576 * 25, //25mb como limite pro vídeo
            }
        })
        
    app.post('/videos', async (request, reply) => {
        const data = await request.file()

        if(!data){
            return reply.status(400).send({error: 'Missing file input.'})
        }

        const extension = path.extname(data.filename)

        if(extension != '.mp3'){
            return reply.status(400).send({error: 'Invalid input type, please upload a MP3'})
        }

        const fileBaseName = path.basename(data.filename, extension) //nome base do arquivo

        const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}` // nome do arquivo através da interpolação e do gerador de id's aleatórios

        const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)   //deixe o node resolver aonde serão salvos os arquivos


        await pump(data.file, fs.createWriteStream(uploadDestination)) //recebe e escreve o arquivo

        const video = await prisma.video.create({
            data:{
                name: data.filename,
                path: uploadDestination,
            }
        })

        return {
            video,
        }
    })
}