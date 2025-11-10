"use client";
import { Avatar, Flex, Panel, Typography } from "@maxhub/max-ui";
import React from "react";
const { Headline } = Typography;
export default function MainPage() {
  return (
    <Panel mode="secondary">
      <Flex direction="column" gap={20} align="center" className="wrap">
        <Avatar.Container size={120}>
          <Avatar.Image
            alt={`Максим Прохоров`} // Заменить на динамический
            fallback="МП" // ЗАменить на динамическое взятие первых букв
            fallbackGradient="purple"
            src="https://pro.guap.ru/avatars/50/50384.JPG"
          />
        </Avatar.Container>
        <Headline>{"Максим Прохоров"}</Headline>
      </Flex>
    </Panel>
  );
}
