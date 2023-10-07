import os
import sys

import backoff
import openai
from langchain.chains import ConversationalRetrievalChain, RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.document_loaders import DirectoryLoader, TextLoader
from langchain.embeddings import OpenAIEmbeddings
from langchain.indexes import VectorstoreIndexCreator
from langchain.indexes.vectorstore import VectorStoreIndexWrapper
from langchain.llms import OpenAI
from langchain.vectorstores import Chroma

import constants

@backoff.on_exception(backoff.expo, openai.error.RateLimitError)

def ai_with_backoff():

	os.environ["OPENAI_API_KEY"] = constants.APIKEY
	PERSIST = True

	query = None
	if len(sys.argv) > 1:
		query = sys.argv[1]

	if PERSIST and os.path.exists("persistdefi"):
		print("Reusing DeFi index...\n")
		vectorstore = Chroma(persist_directory="persistdefi", embedding_function=OpenAIEmbeddings())
		index = VectorStoreIndexWrapper(vectorstore=vectorstore)
	else:
		loader1 = DirectoryLoader(path="../MD/", recursive=True, show_progress=True, silent_errors=True)
		loader2 = DirectoryLoader(path="../PDF/", recursive=True, show_progress=True, silent_errors=True)
		if PERSIST:
			index = VectorstoreIndexCreator(vectorstore_kwargs={"persist_directory":"persistdefi"}).from_loaders([loader1, loader2])
		else:
			index = VectorstoreIndexCreator().from_loaders([loader])

  
	chain = ConversationalRetrievalChain.from_llm(
		llm=ChatOpenAI(model="gpt-4"),
		retriever=index.vectorstore.as_retriever(search_kwargs={"k": 15}),
		verbose=True
	)

	chat_history = []
	while True:
		if not query:
			query = input("Prompt: ")
		if query in ['quit', 'q', 'exit']:
			sys.exit()
		result = chain({"question": query, "chat_history": chat_history})
		print(result['answer'])

		chat_history.append((query, result['answer']))
		query = None
	return
	
ai_with_backoff()