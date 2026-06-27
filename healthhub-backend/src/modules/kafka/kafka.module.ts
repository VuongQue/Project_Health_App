import { Module } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Kafka } from 'kafkajs';

@Module({
  providers: [
    {
      provide: 'KAFKA_CLIENT',
      useFactory: () => {
        return new ClientKafka({
          client: {
            clientId: 'healthhub-producer',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        });
      },
    },
  ],
  exports: ['KAFKA_CLIENT'], 
})
export class KafkaModule {}
